import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Erreur capturée:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle" size={64} color={COLORS.ERROR} />
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Erreur inconnue'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
