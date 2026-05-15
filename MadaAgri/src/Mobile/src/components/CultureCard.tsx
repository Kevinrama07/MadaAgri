import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import { getSuitabilityColor, getSuitabilityLabel, getCultureCategory, getCategoryEmoji } from '../utils/cultureUtils';
import { CultureAnalysisResult } from '../types/culture.types';

interface CultureCardProps {
  culture: CultureAnalysisResult | null | undefined;
  onPress?: () => void;
}

function CultureCard({ culture, onPress }: CultureCardProps) {
  // Protection contre les données nulles ou malformées
  if (!culture) {
    return null;
  }

  const score = culture.suitability_score || culture.score || 0;
  const cultureName = culture.culture?.name || culture.culture_name || 'Culture inconnue';
  const description = culture.culture?.description || '';
  const idealSoil = culture.culture?.ideal_soil || '';
  const idealClimate = culture.culture?.ideal_climate || '';
  const growingPeriod = culture.culture?.growing_period_days || 0;
  const yieldPotential = culture.culture?.yield_potential || '';
  
  const category = getCultureCategory(cultureName);
  const emoji = getCategoryEmoji(category);
  const scoreColor = getSuitabilityColor(score);
  const scoreLabel = getSuitabilityLabel(score);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={`Culture ${cultureName}, score de compatibilité ${score}%`}
      accessibilityRole="button"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View style={styles.titleTextContainer}>
            <Text style={styles.cultureName} numberOfLines={1}>
              {cultureName}
            </Text>
            <Text style={styles.category}>{category}</Text>
          </View>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
          <Text style={styles.scoreText}>{score}%</Text>
        </View>
      </View>

      {/* Description */}
      {description ? (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${score}%`, backgroundColor: scoreColor }
            ]} 
          />
        </View>
        <Text style={styles.scoreLabel}>{scoreLabel}</Text>
      </View>

      {/* Details */}
      <View style={styles.details}>
        {idealSoil ? (
          <View style={styles.detailItem}>
            <Ionicons name="earth" size={14} color={COLORS.PRIMARY} />
            <Text style={styles.detailText} numberOfLines={1}>
              {idealSoil}
            </Text>
          </View>
        ) : null}
        
        {idealClimate ? (
          <View style={styles.detailItem}>
            <Ionicons name="sunny" size={14} color={COLORS.PRIMARY} />
            <Text style={styles.detailText} numberOfLines={1}>
              {idealClimate}
            </Text>
          </View>
        ) : null}
        
        {growingPeriod > 0 ? (
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={14} color={COLORS.PRIMARY} />
            <Text style={styles.detailText}>
              {growingPeriod} jours
            </Text>
          </View>
        ) : null}
        
        {yieldPotential ? (
          <View style={styles.detailItem}>
            <Ionicons name="bar-chart" size={14} color={COLORS.PRIMARY} />
            <Text style={styles.detailText} numberOfLines={1}>
              {yieldPotential}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: BORDER_RADIUS.LARGE,
    padding: SPACING.LG,
    marginBottom: SPACING.LG,
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.SM,
  },
  emoji: {
    fontSize: 40,
    marginRight: SPACING.MD,
  },
  titleTextContainer: {
    flex: 1,
  },
  cultureName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  category: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  scoreBadge: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MEDIUM,
    minWidth: 74,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    lineHeight: 22,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: SPACING.LG,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: BORDER_RADIUS.SMALL,
    overflow: 'hidden',
    marginBottom: SPACING.SM,
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.SMALL,
  },
  scoreLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.MD,
    paddingTop: SPACING.LG,
    borderTopWidth: 2,
    borderTopColor: 'rgba(46, 125, 50, 0.08)',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    maxWidth: '48%',
    paddingVertical: SPACING.SM,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    flex: 1,
  },
});

// Optimisation avec React.memo pour éviter les re-renders inutiles
export default React.memo(CultureCard, (prevProps, nextProps) => {
  return (
    prevProps.culture?.culture?.id === nextProps.culture?.culture?.id &&
    prevProps.culture?.suitability_score === nextProps.culture?.suitability_score
  );
});
