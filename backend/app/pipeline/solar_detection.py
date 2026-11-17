# PyTorch / Ultralytics Solar Panel Aerial Adoption Detection Engine
import os
import math
import numpy as np

# Try importing deep learning framework dependencies, fallback gracefully if absent
try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

try:
    from ultralytics import YOLO
    HAS_ULTRALYTICS = True
except ImportError:
    HAS_ULTRALYTICS = False

class SolarPanelDetector:
    def __init__(self, model_path: str = None):
        self.model_path = model_path
        self.model = None
        self.is_mock = True
        
        # Load the model if weights are provided and library exists
        if HAS_ULTRALYTICS and model_path and os.path.exists(model_path):
            try:
                self.model = YOLO(model_path)
                self.is_mock = False
                print(f"[SOLAR DETECTOR] Loaded YOLOv8 weights successfully from {model_path}")
            except Exception as e:
                print(f"[SOLAR DETECTOR] Error loading YOLOv8: {e}. Falling back to simulated engine.")
        else:
            print("[SOLAR DETECTOR] Ultralytics YOLOv8 library not installed or weights missing. Running in Simulation/Inference mode.")

    def detect_solar_panels_from_tile(self, tile_img_path: str, meters_per_pixel: float = 0.3) -> list:
        """
        Processes an aerial/satellite image tile and detects solar panels.
        Returns a list of detected panels with their coordinates, pixel area, physical area (sqm), and kW capacity.
        """
        if not os.path.exists(tile_img_path):
            raise FileNotFoundError(f"Satellite tile not found at {tile_img_path}")

        # If running in production with real YOLOv8 model
        if not self.is_mock and self.model:
            results = self.model(tile_img_path)
            detections = []
            
            # Iterate through model results
            for result in results:
                if result.masks is not None:
                    # YOLOv8-segmentation polygon masks
                    for idx, polygon in enumerate(result.masks.xy):
                        class_id = int(result.boxes.cls[idx].item())
                        confidence = float(result.boxes.conf[idx].item())
                        
                        # Assuming Class 0 is 'solar_panel'
                        if class_id == 0:
                            # Calculate polygon area using Shoelace formula
                            pixel_area = self._calculate_polygon_pixel_area(polygon)
                            sqm_area = pixel_area * (meters_per_pixel ** 2)
                            capacity_kw = sqm_area / 10.0 # 10 sqm = 1 kW
                            
                            detections.append({
                                "panel_id": f"panel_poly_{idx+1}",
                                "type": "segmentation",
                                "confidence": confidence,
                                "boundary_points": polygon.tolist(),
                                "pixel_area": float(pixel_area),
                                "usable_roof_area_sqm": float(sqm_area),
                                "estimated_kw_capacity": round(float(capacity_kw), 2)
                            })
                else:
                    # Fallback to bounding boxes if segmentation masks are not active
                    for idx, box in enumerate(result.boxes.xyxy):
                        class_id = int(result.boxes.cls[idx].item())
                        confidence = float(result.boxes.conf[idx].item())
                        
                        if class_id == 0:
                            x1, y1, x2, y2 = box.tolist()
                            width = x2 - x1
                            height = y2 - y1
                            pixel_area = width * height
                            sqm_area = pixel_area * (meters_per_pixel ** 2)
                            capacity_kw = sqm_area / 10.0
                            
                            detections.append({
                                "panel_id": f"panel_box_{idx+1}",
                                "type": "bbox",
                                "confidence": confidence,
                                "boundary_points": [[x1, y1], [x2, y1], [x2, y2], [x1, y2]],
                                "pixel_area": float(pixel_area),
                                "usable_roof_area_sqm": float(sqm_area),
                                "estimated_kw_capacity": round(float(capacity_kw), 2)
                            })
            return detections
            
        else:
            # High-fidelity Simulation Engine for offline testing / mock tiles
            # We generate deterministic detections based on file size or path hash
            file_hash = sum(ord(c) for c in os.path.basename(tile_img_path))
            np.random.seed(file_hash)
            
            num_panels = np.random.randint(1, 4)
            detections = []
            
            for i in range(num_panels):
                # Mock a polygon panel on the roof
                center_x = np.random.randint(100, 400)
                center_y = np.random.randint(100, 400)
                w = np.random.randint(40, 120)
                h = np.random.randint(40, 120)
                
                polygon = [
                    [center_x - w//2, center_y - h//2],
                    [center_x + w//2, center_y - h//2],
                    [center_x + w//2, center_y + h//2],
                    [center_x - w//2, center_y + h//2]
                ]
                
                pixel_area = float(w * h)
                sqm_area = pixel_area * (meters_per_pixel ** 2)
                capacity_kw = sqm_area / 10.0
                
                detections.append({
                    "panel_id": f"sim_panel_{i+1}",
                    "type": "segmentation",
                    "confidence": float(np.random.uniform(0.82, 0.98)),
                    "boundary_points": polygon,
                    "pixel_area": pixel_area,
                    "usable_roof_area_sqm": round(sqm_area, 2),
                    "estimated_kw_capacity": round(capacity_kw, 2)
                })
            return detections

    def _calculate_polygon_pixel_area(self, points: np.ndarray) -> float:
        """
        Calculates the area of a polygon using the Shoelace formula.
        points shape: (N, 2) representing N coordinate pairs [x, y].
        """
        x = points[:, 0]
        y = points[:, 1]
        return 0.5 * np.abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))

    def convert_roof_footprint_to_kw(self, roof_area_sqm: float, utilization_ratio: float = 0.4) -> float:
        """
        Converts the overall footprint of a roof to estimated solar capacity (kW),
        assuming typical panel metrics and spacing constraints (e.g. 40% usable space).
        Standard: 1 kW solar system takes ~10 square meters of panel area.
        """
        usable_area = roof_area_sqm * utilization_ratio
        return round(usable_area / 10.0, 2)
