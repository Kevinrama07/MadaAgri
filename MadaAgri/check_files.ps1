$files = @(
    "src/frontend/src/pages/Landing/LandingPage.jsx",
    "src/frontend/src/pages/Connection/FormulaireAuth.jsx",
    "src/frontend/src/pages/Dashboard/FeedPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/PublicationPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/NetworkPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/MessagesPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/ProductsPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/OrdersPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/ReceivedOrdersPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/ProductManagementPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/CreateProductPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/AgriculturePageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/RoutesPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/MeteoPageWrapper.jsx",
    "src/frontend/src/pages/Dashboard/DashboardPageWrapper.jsx",
    "src/frontend/src/pages/Marketplace/MarketplacePage.jsx",
    "src/frontend/src/pages/ProductDetail/ProductDetailPage.jsx",
    "src/frontend/src/pages/Profile/ProfilePage.jsx",
    "src/frontend/src/pages/Settings/SettingsPage.jsx",
    "src/frontend/src/pages/Dashboard/Dashboard.jsx",
    "src/frontend/src/pages/Landing/Landing.jsx",
    "src/frontend/src/pages/Marketplace/Marketplace.jsx",
    "src/frontend/src/pages/ProductDetail/ProductDetail.jsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "EXISTS: $file"
    } else {
        Write-Host "MISSING: $file"
    }
}
