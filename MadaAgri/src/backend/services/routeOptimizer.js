class RouteOptimizer {
  static haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static clusterDeliveries(deliveries, radiusKm = 5) {
    if (deliveries.length === 0) return [];
    if (deliveries.length === 1) return [[deliveries[0]]];

    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < deliveries.length; i++) {
      if (visited.has(i)) continue;

      const cluster = [deliveries[i]];
      visited.add(i);

      for (let j = i + 1; j < deliveries.length; j++) {
        if (visited.has(j)) continue;

        const distance = this.haversineDistance(
          deliveries[i].latitude,
          deliveries[i].longitude,
          deliveries[j].latitude,
          deliveries[j].longitude
        );

        if (distance <= radiusKm) {
          cluster.push(deliveries[j]);
          visited.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  static nearestNeighbor(deliveries, startPoint = null) {
    if (deliveries.length === 0) return [];
    if (deliveries.length === 1) return deliveries;

    const route = [];
    const visited = new Set();
    let currentPoint = startPoint || deliveries[0];

    route.push(currentPoint);
    if (!startPoint) {
      visited.add(0);
    }

    while (route.length < deliveries.length) {
      let nearest = null;
      let minDistance = Infinity;
      let nearestIndex = -1;

      for (let i = 0; i < deliveries.length; i++) {
        if (visited.has(i)) continue;

        const distance = this.haversineDistance(
          currentPoint.latitude,
          currentPoint.longitude,
          deliveries[i].latitude,
          deliveries[i].longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearest = deliveries[i];
          nearestIndex = i;
        }
      }

      if (nearest) {
        route.push(nearest);
        visited.add(nearestIndex);
        currentPoint = nearest;
      }
    }

    return route;
  }
  static clarkeWrightSavings(deliveries, depot) {
    if (deliveries.length === 0) return [];
    if (deliveries.length === 1) return deliveries;

    // Initialiser avec dépôt
    depot = depot || { id: 'depot', latitude: 0, longitude: 0, ...deliveries[0] };

    // Calculer les économies (savings) pour chaque paire
    const savings = [];
    for (let i = 0; i < deliveries.length; i++) {
      for (let j = i + 1; j < deliveries.length; j++) {
        const distDepotI = this.haversineDistance(
          depot.latitude,
          depot.longitude,
          deliveries[i].latitude,
          deliveries[i].longitude
        );
        const distDepotJ = this.haversineDistance(
          depot.latitude,
          depot.longitude,
          deliveries[j].latitude,
          deliveries[j].longitude
        );
        const distIJ = this.haversineDistance(
          deliveries[i].latitude,
          deliveries[i].longitude,
          deliveries[j].latitude,
          deliveries[j].longitude
        );

        const saving = distDepotI + distDepotJ - distIJ;
        savings.push({
          i,
          j,
          saving,
          distance: distIJ
        });
      }
    }

    // Trier par économies décroissantes
    savings.sort((a, b) => b.saving - a.saving);

    // Construire les routes en fusionnant les points
    const routes = deliveries.map((d, idx) => [idx]);
    let merged = true;

    for (const { i, j } of savings) {
      if (!merged) break;

      let routeI = routes.find((r) => r.includes(i));
      let routeJ = routes.find((r) => r.includes(j));

      if (routeI && routeJ && routeI !== routeJ) {
        // Fusionner les routes
        const merged_route = [...routeI, ...routeJ];
        const idx1 = routes.indexOf(routeI);
        const idx2 = routes.indexOf(routeJ);

        routes[idx1] = merged_route;
        routes.splice(idx2, 1);
      }
    }

    // Convertir les indices en objets et optimiser chaque route
    const optimizedRoutes = routes.map((route) => {
      const routeDeliveries = route.map((idx) => deliveries[idx]);
      return this.nearestNeighbor(routeDeliveries);
    });

    // Retourner la route unique ou la meilleure
    return optimizedRoutes.length === 1 ? optimizedRoutes[0] : optimizedRoutes.flat();
  }
  static optimizeRoutes(deliveries, options = {}) {
    const {
      algorithm = 'nearest-neighbor',
      clusterRadius = 5,
      enableClustering = true,
      depot = null,
      maxCapacity = null
    } = options;

    if (deliveries.length === 0) {
      return {
        success: false,
        message: 'Aucune livraison à optimiser',
        routes: []
      };
    }

    let routes = [];

    // Clustering si activé
    if (enableClustering && deliveries.length > 3) {
      const clusters = this.clusterDeliveries(deliveries, clusterRadius);
      routes = clusters.map((cluster) => {
        if (algorithm === 'clarke-wright') {
          return this.clarkeWrightSavings(cluster, depot);
        }
        return this.nearestNeighbor(cluster, depot);
      });
    } else {
      // Une seule route
      if (algorithm === 'clarke-wright') {
        routes = [this.clarkeWrightSavings(deliveries, depot)];
      } else {
        routes = [this.nearestNeighbor(deliveries, depot)];
      }
    }

    // Calculer les statistiques
    const stats = this.calculateStats(routes, depot);

    return {
      success: true,
      routes,
      statistics: stats,
      totalDistance: stats.totalDistance,
      totalEstimatedTime: stats.totalTime,
      numberOfRoutes: routes.length,
      deliveriesPerRoute: routes.map((r) => r.length)
    };
  }

  static calculateStats(routes, depot = null) {
    let totalDistance = 0;
    let totalTime = 0;
    const routeStats = [];

    routes.forEach((route) => {
      let routeDistance = 0;

      for (let i = 0; i < route.length - 1; i++) {
        const distance = this.haversineDistance(
          route[i].latitude,
          route[i].longitude,
          route[i + 1].latitude,
          route[i + 1].longitude
        );
        routeDistance += distance;
      }

      // Ajouter retour au dépôt si fourni
      if (depot && route.length > 0) {
        const lastPoint = route[route.length - 1];
        const returnDistance = this.haversineDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          depot.latitude || 0,
          depot.longitude || 0
        );
        routeDistance += returnDistance;
      }

      // Estimer le temps (moyenne 40 km/h)
      const routeTime = routeDistance / 40;

      totalDistance += routeDistance;
      totalTime += routeTime;

      routeStats.push({
        distance: routeDistance,
        time: routeTime,
        stops: route.length
      });
    });

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTime: Math.round(totalTime * 100) / 100,
      averageDistancePerRoute:
        Math.round((totalDistance / routes.length) * 100) / 100,
      routeStats
    };
  }

  static reoptimizeAfterRemoval(currentRoute, deliveryId) {
    const filtered = currentRoute.filter((d) => d.id !== deliveryId);
    if (filtered.length === 0) return [];
    return this.nearestNeighbor(filtered);
  }
}

module.exports = RouteOptimizer;
