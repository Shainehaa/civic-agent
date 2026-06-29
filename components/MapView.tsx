"use client";

// Leaflet directly touches the browser's `window` object, which doesn't
// exist during Next.js's server-side rendering step. This component is
// only ever loaded via dynamic(() => import(...), { ssr: false }) — see
// where it's used in dashboard/page.tsx — so it's safe here.

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CivicIssue } from "@/types";
import { isOverdue } from "@/services/issueService";
import Link from "next/link";

interface MapViewProps {
  issues: CivicIssue[];
}

// Leaflet's default marker icons reference image files in a way that
// breaks under Next.js's bundler. This rebuilds the icon using URLs
// that resolve correctly, using CDN-hosted marker images.
const defaultIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const overdueIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x-red.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapView({ issues }: MapViewProps) {
  // Center the map on the average location of all issues, falling back
  // to a default India-centered view if there are no issues yet.
  const center: [number, number] =
    issues.length > 0
      ? [
          issues.reduce((sum, i) => sum + i.latitude, 0) / issues.length,
          issues.reduce((sum, i) => sum + i.longitude, 0) / issues.length,
        ]
      : [20.5937, 78.9629]; // roughly the center of India

  return (
    <MapContainer
      center={center}
      zoom={issues.length > 0 ? 13 : 5}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {issues.map((issue) => (
        <Marker
          key={issue.id}
          position={[issue.latitude, issue.longitude]}
          icon={isOverdue(issue) ? overdueIcon : defaultIcon}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-medium">{issue.issueType}</p>
              <p className="text-sm text-zinc-600">{issue.severity} severity</p>
              <Link
                href={`/issue/${issue.id}`}
                className="text-sm text-blue-600 underline"
              >
                View details
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
