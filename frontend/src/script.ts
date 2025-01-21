//
//
// const map = L.map('map').setView([0, 0], 3);
//
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
// }).addTo(map);
//
// map.on('zoomend', () => {
//
//     async function fetchData() {
//         try {
//             const response = await fetch('http://localhost:8082/get-geojson');
//             const data = await response.json();
//             console.log('Data:', data);
//             L.geoJSON(data, {
//                 pointToLayer: (feature:any, latlng: any) => {
//                     const marker = L.marker(latlng);
//
//                     // Fetch and update popup asynchronously
//                     loadPointPopup(feature.properties.id).then((popupContent) => {
//                         marker.bindPopup(popupContent);
//                     }).catch((error) => {
//                         console.error('Error loading popup:', error);
//                         marker.bindPopup('<div>Error loading popup content</div>');
//                     });
//
//                     return marker; // Return the marker synchronously
//                 },
//             }).addTo(map)
//
//             console.log('GeoJSON loaded and added to the map.');
//         } catch (error) {
//             console.error('Error:', error);
//         }
//     }
//     fetchData();
//
// });
//
// async function loadPointPopup(id: string) {
//     console.log('Loading popup for feature:', id);
//     try {
//         // Fetch the HTML template
//         const response = await fetch('/static/templates/popup-point-info.html');
//         let template = await response.text();
//
//         console.log('Template:', template);
//         // Replace placeholders (e.g., {{id}}) with actual values
//         template = template.replace(/{{id}}/g, id);
//
//         return template; // Return the processed HTML
//     } catch (error) {
//         console.error("Error loading template:", error);
//         return "<div>Error loading popup content</div>";
//     }
// }
//
// //
// // map.on('moveend', () => {
// //     htmx.trigger('#info', 'map:moveend', {
// //         detail: { zoom: map.getZoom(), center: map.getCenter() }
// //     });
// // });