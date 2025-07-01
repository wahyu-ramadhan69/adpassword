param (
    [string]$username,
    [string]$newPlainPassword
)

Import-Module ActiveDirectory
$newPassword = ConvertTo-SecureString $newPlainPassword -AsPlainText -Force

try {
    $user = Get-ADUser -Identity $username -ErrorAction Stop
    Set-ADAccountPassword -Identity $username -NewPassword $newPassword -Reset
    Set-ADUser -Identity $username -ChangePasswordAtLogon $false
    Write-Output "success"
} catch {
    Write-Output "failed: $_"
}
