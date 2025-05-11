'use client';

import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

type Point = {
  latitude: number;
  longitude: number;
  title?: string;
};

interface AmMapProps {
  points: Point[];
}

export default function AmMap({ points }: AmMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!mapRef.current) return;

    const root = am5.Root.new(mapRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: 'rotateX',
        panY: 'none',
        projection: am5map.geoMercator(),
        homeZoomLevel: 1.2,
      })
    );
    chart.set('wheelable', false);

    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow,
        exclude: ['AQ'], // Remove Antarctica
      })
    );

    // Base map style
    polygonSeries.mapPolygons.template.setAll({
      tooltipText: '{name}',
      interactive: true,
      fill: am5.color(0xd3d3d3),
      stroke: am5.color(0x999999),
    });

    // Hover effect
    polygonSeries.mapPolygons.template.states.create('hover', {
      fill: am5.color(0x5b9bd5),
    });

    // Zoom on click
    polygonSeries.mapPolygons.template.events.on('click', (ev) => {
  const polygon = ev.target as am5map.MapPolygon;

  const geometry = (polygon.dataItem?.dataContext as any)?.geometry;
  if (!geometry?.coordinates) return;

  let coords: any[] = [];

  // Handle both Polygon and MultiPolygon types
  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    coords = geometry.coordinates[0][0];
  }

  if (coords.length > 0) {
    const midIndex = Math.floor(coords.length / 2);
    const point = coords[midIndex];

    if (Array.isArray(point) && point.length === 2) {
      const [lon, lat] = point;
      chart.zoomToGeoPoint({ longitude: lon, latitude: lat }, 4);
    }
  }
});

    // Point markers (IP locations)
    const pointSeries = chart.series.push(
      am5map.MapPointSeries.new(root, {
        latitudeField: 'latitude',
        longitudeField: 'longitude',
      })
    );

    pointSeries.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 5,
          tooltipText: '{title}',
          fill: am5.color(0x3b82f6),
          stroke: am5.color(0xffffff),
          strokeWidth: 1,
        }),
      })
    );

    pointSeries.data.setAll(points);

    return () => {
      root.dispose();
    };
  }, [points]);

  return (
    <div
        ref={mapRef}
        style={{
        width: '100%',
        height: '600px',
        maxWidth: '100%',
        overflow: 'hidden',
        }}
    />
    );
}