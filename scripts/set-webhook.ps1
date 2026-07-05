param(
    [Parameter(Mandatory = $true)]
    [string]$WebhookUrl,

    [string]$SecretToken = $env:TELEGRAM_WEBHOOK_SECRET
)

$botToken = $env:TELEGRAM_BOT_TOKEN
if (-not $botToken) {
    $botToken = $env:BOT_TOKEN
}

if (-not $botToken) {
    Write-Error "Set TELEGRAM_BOT_TOKEN or BOT_TOKEN before running this script."
    exit 1
}

$body = @{
    url = $WebhookUrl
}

if ($SecretToken) {
    $body.secret_token = $SecretToken
}

$uri = "https://api.telegram.org/bot$botToken/setWebhook"
$response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body ($body | ConvertTo-Json)

Write-Output $response

$infoUri = "https://api.telegram.org/bot$botToken/getWebhookInfo"
$info = Invoke-RestMethod -Uri $infoUri -Method Get
Write-Output $info
