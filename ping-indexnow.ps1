$key = "a7f3d82e1b6c4590"
$host_name = "who.subarnakatwal.com.np"

$body = @{
    host        = $host_name
    key         = $key
    keyLocation = "https://$host_name/$key.txt"
    urlList     = @(
        "https://$host_name/",
        "https://$host_name/assets/cv",
        "https://$host_name/links"
    )
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -Uri "https://api.indexnow.org/indexnow" `
    -Method POST `
    -ContentType "application/json; charset=utf-8" `
    -Body $body

Write-Host "Status: $($response.StatusCode)"
Write-Host "IndexNow ping sent to Bing, Yandex, Brave (all share the protocol)"
