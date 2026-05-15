export const diagnoseTheme = (themeContext) => {
  console.log('=== DIAGNOSTIC THEME ===');
  
  // Vérifier le contexte
  if (!themeContext) {
    console.error('❌ ThemeContext est undefined');
    return false;
  }
  
  console.log('✅ ThemeContext existe');
  
  // Vérifier theme.theme
  const theme = themeContext.theme;
  if (!theme) {
    console.error('❌ theme.theme est undefined');
    return false;
  }
  
  console.log('✅ theme.theme existe');
  
  // Vérifier colors
  const colors = theme.colors || themeContext.colors;
  if (!colors) {
    console.error('❌ colors est undefined');
    return false;
  }
  
  console.log('✅ colors existe:', Object.keys(colors));
  
  // Vérifier typography
  const typography = theme.typography;
  if (!typography) {
    console.error('❌ typography est undefined');
    return false;
  }
  
  console.log('✅ typography existe:', Object.keys(typography));
  
  // Vérifier les propriétés typography critiques
  const criticalTypography = ['body', 'caption', 'subheading', 'bodySmall'];
  for (const key of criticalTypography) {
    if (!typography[key]) {
      console.error(`❌ typography.${key} est undefined`);
      return false;
    }
    
    if (!typography[key].fontSize) {
      console.error(`❌ typography.${key}.fontSize est undefined`);
      return false;
    }
    
    console.log(`✅ typography.${key}.fontSize = ${typography[key].fontSize}`);
  }
  
  // Vérifier spacing
  const spacing = theme.spacing;
  if (!spacing) {
    console.error('❌ spacing est undefined');
    return false;
  }
  
  console.log('✅ spacing existe:', Object.keys(spacing));
  
  console.log('=== DIAGNOSTIC TERMINÉ - SUCCÈS ===');
  return true;
};

export const getThemeFallbacks = () => ({
  colors: {
    text: '#1C1E21',
    textSecondary: '#65676B',
    textTertiary: '#8A8D91',
    secondaryBackground: '#F5F5F5',
    border: '#E4E6EB',
    error: '#C62828',
    primary: '#2E7D32',
    card: '#FFFFFF',
    primaryBackground: '#F5F5F5',
  },
  typography: {
    display: { fontSize: 32 },
    h1: { fontSize: 24 },
    h2: { fontSize: 20 },
    h3: { fontSize: 18 },
    subheading: { fontSize: 16 },
    body: { fontSize: 14 },
    bodySmall: { fontSize: 13 },
    bodyLarge: { fontSize: 15 },
    label: { fontSize: 12 },
    caption: { fontSize: 11 },
  },
  spacing: {
    SM: 8,
    MARGIN_DEFAULT: 12,
    MARGIN_LARGE: 16,
    PADDING_DEFAULT: 12,
  },
  borderRadius: {
    IMAGE: 12,
    DEFAULT: 8,
  },
});