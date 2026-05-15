import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { formatPrice } from '../utils/helpers';

export const ProductCard = ({ product, onPress }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      marginVertical: 8,
      marginHorizontal: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    image: {
      width: '100%',
      height: 200,
      backgroundColor: colors.border,
    },
    content: {
      padding: 12,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: 12,
      color: colors.text + '80',
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    price: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    region: {
      fontSize: 12,
      color: colors.secondary,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {product.image && <Image source={{ uri: product.image }} style={styles.image} />}
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.description}>{product.culture}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.region}>{product.region}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;
