import React, { useRef, useEffect, useState } from 'react';

import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax

mapboxgl.accessToken = 'pk.eyJ1IjoicGFudGVtb24iLCJhIjoiY2xydHFsOHp1MDllajJpbXI2YmNmOWNvcSJ9.A2uKysjhviqnhzIuvBzDqA';

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });

    map.current.on('load', () => {
      // Add a new source from our GeoJSON data and
      // set the 'cluster' option to true. GL-JS will
      // add the point_count property to your source data.
      map.current.addSource('schools', {
        type: 'geojson',
        // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
        // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
        data: '/data.geojson',
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
      });

      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'schools',
        filter: ['has', 'point_count'],
        paint: {
          // Use step expressions (https://docs.mapbox.com/style-spec/reference/expressions/#step)
          // with three steps to implement three types of circles:
          //   * Blue, 20px circles when point count is less than 100
          //   * Yellow, 30px circles when point count is between 100 and 750
          //   * Pink, 40px circles when point count is greater than or equal to 750
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      });

      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'schools',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'schools',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // inspect a cluster on click
      map.current.on('click', 'clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });

        const clusterId = features[0].properties.cluster_id;

        map.current.getSource('schools').getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;

            map.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          }
        );
      });

      // When a click event occurs on a feature in
      // the unclustered-point layer, open a popup at
      // the location of the feature, with
      // description HTML from its properties.
      map.current.on('click', 'unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();

        const school = e.features[0].properties.school;
        const school_type = (e.features[0].properties.school_type).toLowerCase();
        const student_count = e.features[0].properties.student_count;

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        const description = student_count == 1 ? `There is 1 student attending this ${school_type}.` : `There are ${student_count} students attending this ${school_type}.`

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(
            `<h3>${school}</h3><p>${description}</p>`
          )
          .addTo(map.current);
      });

      map.current.on('mouseenter', 'clusters', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'clusters', () => {
        map.current.getCanvas().style.cursor = '';
      });
    });
  });

  return (
    <div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}