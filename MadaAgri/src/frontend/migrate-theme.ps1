# Script de Migration Automatique - Système de Thème MadaAgri
# Ce script remplace automatiquement les anciennes variables CSS par les nouvelles

Write-Host "🎨 Migration du Système de Thème MadaAgri" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Table de correspondance des variables
$replacements = @{
    'var(--mg-text)' = 'var(--theme-text)'
    'var(--mg-text-muted)' = 'var(--theme-text-muted)'
    'var(--mg-text-secondary)' = 'var(--theme-text-secondary)'
    'var(--mg-primary)' = 'var(--theme-primary)'
    'var(--mg-primary-light)' = 'var(--theme-primary-light)'
    'var(--mg-primary-dark)' = 'var(--theme-primary-dark)'
    'var(--mg-glass-bg)' = 'var(--theme-glass-background)'
    'var(--mg-glass-border)' = 'var(--theme-glass-border)'
    'var(--mg-bg-body)' = 'var(--theme-background)'
    'var(--mg-bg-paper)' = 'var(--theme-surface)'
    'var(--mg-bg-card)' = 'var(--theme-card)'
    'var(--mg-shadow)' = 'var(--theme-shadow)'
    'var(--mg-shadow-md)' = 'var(--theme-shadow-md)'
    'var(--mg-shadow-lg)' = 'var(--theme-shadow-lg)'
    'var(--mg-transition)' = 'var(--theme-transition-duration)'
    'var(--mg-border)' = 'var(--theme-border)'
    'var(--mg-hover)' = 'var(--theme-hover)'
}

$totalFiles = 0
$modifiedFiles = 0
$totalReplacements = 0

# Fonction pour traiter un fichier
function Process-File {
    param($file)
    
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { return $false }
    
    $modified = $false
    $fileReplacements = 0
    
    foreach ($old in $replacements.Keys) {
        $escapedOld = [regex]::Escape($old)
        if ($content -match $escapedOld) {
            $count = ([regex]::Matches($content, $escapedOld)).Count
            $content = $content -replace $escapedOld, $replacements[$old]
            $modified = $true
            $fileReplacements += $count
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✅ $($file.Name) - $fileReplacements remplacements" -ForegroundColor Green
        return $fileReplacements
    }
    
    return 0
}

# Traiter les fichiers CSS
Write-Host "📁 Traitement des fichiers CSS..." -ForegroundColor Yellow
Write-Host ""

$cssFiles = Get-ChildItem -Path "src" -Include "*.css","*.module.css" -Recurse -ErrorAction SilentlyContinue

foreach ($file in $cssFiles) {
    $totalFiles++
    $replacements = Process-File -file $file
    if ($replacements -gt 0) {
        $modifiedFiles++
        $totalReplacements += $replacements
    }
}

# Traiter les fichiers JSX/TSX
Write-Host ""
Write-Host "📁 Traitement des fichiers JSX/TSX..." -ForegroundColor Yellow
Write-Host ""

$jsxFiles = Get-ChildItem -Path "src" -Include "*.jsx","*.tsx" -Recurse -ErrorAction SilentlyContinue

foreach ($file in $jsxFiles) {
    $totalFiles++
    $replacements = Process-File -file $file
    if ($replacements -gt 0) {
        $modifiedFiles++
        $totalReplacements += $replacements
    }
}

# Résumé
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 Résumé de la Migration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Fichiers analysés:    $totalFiles" -ForegroundColor White
Write-Host "Fichiers modifiés:    $modifiedFiles" -ForegroundColor Green
Write-Host "Total remplacements:  $totalReplacements" -ForegroundColor Green
Write-Host ""

if ($modifiedFiles -gt 0) {
    Write-Host "✅ Migration terminée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "1. Vérifier que l'application fonctionne correctement" -ForegroundColor White
    Write-Host "2. Tester le changement de thème" -ForegroundColor White
    Write-Host "3. Vérifier l'accessibilité" -ForegroundColor White
    Write-Host "4. Consulter MIGRATION_GUIDE.md pour plus de détails" -ForegroundColor White
} else {
    Write-Host "ℹ️  Aucune modification nécessaire" -ForegroundColor Blue
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
