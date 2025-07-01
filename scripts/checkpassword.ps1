param (
    [string]$username,
    [string]$oldPassword
)

$domain = "BCAFWIFI.CO.ID"
$securePassword = ConvertTo-SecureString $oldPassword -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("$domain\$username", $securePassword)

try {
    $ldap = New-Object System.DirectoryServices.DirectoryEntry("LDAP://$domain", "$domain\$username", $oldPassword)
    $null = $ldap.NativeObject  # trigger bind
    Write-Output "success"
} catch {
    Write-Output "failed"
}
