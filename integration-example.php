<?php
/**
 * Exemplo de Integração Discord Bot com Sistema PHP
 *
 * Como usar:
 * 1. Incluir este arquivo no DraftService.php
 * 2. Chamar notifyDiscordMatchCreated() quando draft for concluído
 * 3. Chamar notifyDiscordMatchFinished() quando partida for finalizada
 */

class DiscordBotIntegration
{
    private $webhookUrl;
    private $secret;
    private $pdo;

    public function __construct($pdo, $webhookUrl = 'http://localhost:3001', $secret = null)
    {
        $this->pdo = $pdo;
        $this->webhookUrl = $webhookUrl;
        $this->secret = $secret ?? getenv('DISCORD_WEBHOOK_SECRET') ?? 'your_secret_here';
    }

    /**
     * Notifica bot para criar canais de voz quando partida é criada
     */
    public function notifyMatchCreated($matchId)
    {
        try {
            // Buscar dados da partida
            $stmt = $this->pdo->prepare("
                SELECT
                    m.*,
                    d.captain_a_id,
                    d.captain_b_id,
                    d.team_a_picks,
                    d.team_b_picks
                FROM matches m
                LEFT JOIN match_drafts d ON m.id = d.match_id
                WHERE m.id = ?
            ");
            $stmt->execute([$matchId]);
            $match = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$match) {
                error_log("[DISCORD] Match #$matchId não encontrado");
                return false;
            }

            // Pegar jogadores do Time A
            $teamAIds = json_decode($match['team_a_picks'] ?? '[]', true);
            $teamAIds[] = $match['captain_a_id']; // Adicionar capitão
            $teamA = $this->getPlayersWithDiscordId($teamAIds);

            // Pegar jogadores do Time B
            $teamBIds = json_decode($match['team_b_picks'] ?? '[]', true);
            $teamBIds[] = $match['captain_b_id']; // Adicionar capitão
            $teamB = $this->getPlayersWithDiscordId($teamBIds);

            // Verificar se todos têm discord_id
            $missingDiscordId = [];
            foreach (array_merge($teamA, $teamB) as $player) {
                if (empty($player['discord_id'])) {
                    $missingDiscordId[] = $player['nickname'];
                }
            }

            if (!empty($missingDiscordId)) {
                error_log("[DISCORD] Jogadores sem discord_id: " . implode(', ', $missingDiscordId));
                return false;
            }

            // Pegar capitães
            $captainA = $this->getPlayerById($match['captain_a_id']);
            $captainB = $this->getPlayerById($match['captain_b_id']);

            // Montar payload
            $payload = [
                'match_id' => (int)$matchId,
                'team_a' => $this->formatPlayersForDiscord($teamA),
                'team_b' => $this->formatPlayersForDiscord($teamB),
                'captain_a' => [
                    'id' => (int)$captainA['id'],
                    'nickname' => $captainA['nickname']
                ],
                'captain_b' => [
                    'id' => (int)$captainB['id'],
                    'nickname' => $captainB['nickname']
                ],
                'expires_at' => (time() + (120 * 60)) * 1000 // 2 horas em milisegundos
            ];

            // Enviar webhook
            $response = $this->sendWebhook('/webhook/partida-criada', $payload);

            if ($response['success']) {
                error_log("[DISCORD] ✅ Canais criados para Match #$matchId");
                // Salvar IDs dos canais no banco (opcional)
                $this->saveChannelIds($matchId, $response['channels']);
                return $response;
            } else {
                error_log("[DISCORD] ❌ Erro ao criar canais: " . ($response['error'] ?? 'Unknown'));
                return false;
            }

        } catch (Exception $e) {
            error_log("[DISCORD] Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Notifica bot para deletar canais quando partida é finalizada
     */
    public function notifyMatchFinished($matchId)
    {
        try {
            $payload = ['match_id' => (int)$matchId];

            $response = $this->sendWebhook('/webhook/partida-finalizada', $payload);

            if ($response['success']) {
                error_log("[DISCORD] ✅ Canais deletados para Match #$matchId");
                return true;
            } else {
                error_log("[DISCORD] ❌ Erro ao deletar canais: " . ($response['error'] ?? 'Unknown'));
                return false;
            }

        } catch (Exception $e) {
            error_log("[DISCORD] Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Buscar jogadores com discord_id
     */
    private function getPlayersWithDiscordId($userIds)
    {
        if (empty($userIds)) return [];

        $inQuery = implode(',', array_fill(0, count($userIds), '?'));
        $stmt = $this->pdo->prepare("
            SELECT id, nickname, discord_id
            FROM users
            WHERE id IN ($inQuery)
        ");
        $stmt->execute($userIds);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Buscar jogador por ID
     */
    private function getPlayerById($userId)
    {
        $stmt = $this->pdo->prepare("SELECT id, nickname, discord_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Formatar jogadores para enviar ao Discord
     */
    private function formatPlayersForDiscord($players)
    {
        return array_map(function($p) {
            return [
                'id' => (int)$p['id'],
                'nickname' => $p['nickname'],
                'discord_id' => $p['discord_id']
            ];
        }, $players);
    }

    /**
     * Enviar requisição HTTP para webhook
     */
    private function sendWebhook($endpoint, $payload)
    {
        $url = $this->webhookUrl . $endpoint;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->secret
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("cURL Error: $error");
        }

        if ($httpCode !== 200) {
            return ['success' => false, 'error' => "HTTP $httpCode: $response"];
        }

        return json_decode($response, true) ?: ['success' => false, 'error' => 'Invalid JSON response'];
    }

    /**
     * Salvar IDs dos canais no banco (opcional)
     */
    private function saveChannelIds($matchId, $channels)
    {
        // Você pode criar uma tabela match_discord_channels se quiser salvar
        // Por enquanto, apenas logando
        error_log("[DISCORD] Team A Channel: " . $channels['team_a']['id']);
        error_log("[DISCORD] Team B Channel: " . $channels['team_b']['id']);
    }
}

// ==================== EXEMPLO DE USO ====================

/*
// No DraftService.php, após completar draft:

public function completeDraft($draftId)
{
    // ... lógica existente de completar draft ...

    // Criar partida
    $matchId = $this->createMatchFromDraft($draftId);

    // Notificar Discord Bot
    $discordBot = new DiscordBotIntegration($this->pdo);
    $discordBot->notifyMatchCreated($matchId);

    return $matchId;
}

// No MatchService.php, ao finalizar partida:

public function finishMatch($matchId, $winner)
{
    // ... lógica existente de finalizar ...

    // Notificar Discord Bot para deletar canais
    $discordBot = new DiscordBotIntegration($this->pdo);
    $discordBot->notifyMatchFinished($matchId);
}
*/
