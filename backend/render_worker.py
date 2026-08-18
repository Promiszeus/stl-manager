import sys
import zipfile
from pathlib import Path

def extract_3mf_thumbnails(filepath, base_outpath):
    extracted_count = 0
    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            images = [info.filename for info in z.infolist() if info.filename.lower().endswith(('.png', '.jpg', '.jpeg'))]
            if not images: return 0
            
            def sort_key(name):
                return 0 if 'thumbnail' in name.lower() else 1
            images.sort(key=sort_key)
            
            for idx, img_name in enumerate(images):
                outpath = f"{base_outpath}_{idx}.png"
                with z.open(img_name) as f, open(outpath, 'wb') as out:
                    out.write(f.read())
                extracted_count += 1
    except Exception as e:
        pass
    return extracted_count

def render(filepath, base_outpath):
    ext = Path(filepath).suffix.lower().lstrip('.')
    
    if filepath.lower().endswith('.3mf'):
        count = extract_3mf_thumbnails(filepath, base_outpath)
        if count > 0:
            return
            
    if ext in ('step', 'stp', 'gcode'):
        return

    import pyvista as pv
    import trimesh
    import numpy as np

    pv.set_jupyter_backend(None)
    plotter = pv.Plotter(off_screen=True, window_size=[400, 400])
    
    valid_types = {'stl', '3mf', 'obj', 'ply', 'off', 'glb', 'gltf'}
    file_type = ext if ext in valid_types else None
    try:
        if file_type:
            tmesh = trimesh.load(filepath, force='mesh', file_type=file_type)
        else:
            tmesh = trimesh.load(filepath, force='mesh')
    except Exception as e:
        print(f"Trimesh error loading {filepath}: {e}", file=sys.stderr)
        return
    
    if isinstance(tmesh, trimesh.Scene):
        meshes = list(tmesh.geometry.values())
        if not meshes:
            print(f"No meshes found in scene: {filepath}", file=sys.stderr)
            return
        tmesh = trimesh.util.concatenate(meshes)

    if len(tmesh.faces) == 0:
        print(f"Empty mesh (no faces): {filepath}", file=sys.stderr)
        return

    faces = np.column_stack((np.full(len(tmesh.faces), 3), tmesh.faces)).flatten()
    mesh = pv.PolyData(tmesh.vertices, faces)
    
    # Use flat shading (smooth_shading=False) for mechanical parts to keep edges sharp.
    # We turn off show_edges so it doesn't draw internal triangles on flat surfaces.
    plotter.add_mesh(mesh, color="#f0f0f0", smooth_shading=False, show_edges=False, scalars=None, show_scalar_bar=False)
    
    # Add an extra light to improve contrast
    light = pv.Light(position=(10, 10, 10), focal_point=(0, 0, 0), color='white', intensity=0.5)
    plotter.add_light(light)
    
    plotter.camera_position = 'iso'
    outpath = f"{base_outpath}_0.png"
    plotter.screenshot(outpath, transparent_background=True)
    plotter.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    render(sys.argv[1], sys.argv[2])
