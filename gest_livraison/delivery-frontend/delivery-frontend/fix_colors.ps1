$files = @(
    'src\components\dashboard\Settings.jsx',
    'src\components\dashboard\Profile.jsx',
    'src\components\dashboard\NotificationsView.jsx',
    'src\components\dashboard\DeliveriesList.jsx',
    'src\components\dashboard\CreateDelivery.jsx',
    'src\components\dashboard\ClientInvoices.jsx',
    'src\components\admin\RegionManagement.jsx',
    'src\components\admin\InvoiceManagement.jsx',
    'src\components\admin\ComplaintManagement.jsx',
    'src\components\admin\DeliverySlipManagement.jsx'
)

foreach($f in $files) {
    if(Test-Path $f) {
        $c = Get-Content $f -Raw
        $c = $c -replace '#2d1810','#0f172a'
        $c = $c -replace '#b8826b','#3b82f6'
        $c = $c -replace '#faf8f6','#f8fafc'
        $c = $c -replace '#e6ddd5','#e2e8f0'
        $c = $c -replace '#9c8678','#64748b'
        $c = $c -replace '#6b5447','#475569'
        $c = $c -replace '#d4c4b8','#94a3b8'
        $c = $c -replace '#4a3728','#1e293b'
        $c = $c -replace '#d4a574','#f59e0b'
        $c = $c -replace '#6b9c6a','#10b981'
        $c = $c -replace '#a8b8d4','#94a3b8'
        $c = $c -replace '#f5f0ec','#f1f5f9'
        $c = $c -replace "Crimson Pro","Inter"
        Set-Content $f $c -NoNewline
        Write-Host "Updated: $f"
    } else {
        Write-Host "NOT FOUND: $f"
    }
}
