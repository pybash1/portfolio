"""Model and path-trace the ADD Gel Designer Series pen in Blender (Cycles).

    blender -b --factory-startup --python pen.py -- <black|blue> <angle°> <body|button|refill> <out.png> [samples]

The geometry comes from model.json (exported from src/lib/penModel.ts by
export-model.ts), the print on the barrel from print.png (print.cjs). World
units are millimetres: x along the pen (cone mouth at 0), y toward the top of
the screen, z toward the viewer; the pen's axis is at z = 0 and it lies on the
desk. The camera looks straight down, orthographic, like the rest of the desk.

The desk light is the site's (src/lib/folderShadow.ts defaultFolderLight): a
sun whose rays fall (0.35, 0.45) per unit of height across the screen, from a
disc 0.11 wide per unit of height. The pen is turned `angle` degrees on screen
(CSS rotate), so the light is turned into the pen's own frame. The surface
lies underneath: hidden from the camera but seen in the chrome and lacquer and
bouncing light, so the pen picks up the desk it lies on. Its own shadow on the
desk is drawn by the page, not baked here.

Each part renders on its own transparent layer: `body` (everything but the
button and the refill), `button` (slides in under the collar when clicked) and
`refill` (drawn with its point out; the page slides it back into the cone).
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Vector

here = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[sys.argv.index("--") + 1:]
color, angle, part, out = args[0], float(args[1]), args[2], args[3]
samples = int(args[4]) if len(args) > 4 else 512
model = json.load(open(os.path.join(here, "model.json")))

# Render frame (mm) and resolution: 6.5 px per mm (about 3× the page's scale),
# chosen so the frame is a whole number of pixels both ways (988 × 91).
X0, X1, HALF_H, PX_PER_MM = -6.0, 146.0, 7.0, 6.5
LIGHT = (0.35, 0.45, 0.11)  # ray offset per unit height (screen x, y down), disc radius
AROUND = 160
# The desk's light is dim and warm (its steel clips run #263022 → #a9aaa0 → #f1efd5).
WARM = (1.0, 0.95, 0.8)
ROOM_STRENGTH = float(os.environ.get("ROOM_STRENGTH", 0.7))
# Window brightness against how directly a direction faces the desk light
# (0 = opposite, 0.5 = at right angles, 1 = straight at it).
WINDOW = json.loads(os.environ.get("WINDOW", "[[0, 0.05], [0.5, 0.1], [0.78, 0.28], [0.9, 0.95], [0.96, 2.0], [1, 2.4]]"))

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "METAL"
prefs.get_devices()
for device in prefs.devices: device.use = True
scene.cycles.device = "GPU"
scene.cycles.samples = samples
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 12
scene.cycles.glossy_bounces = 8
scene.cycles.transparent_max_bounces = 8
scene.render.film_transparent = True
scene.render.resolution_x = round((X1 - X0) * PX_PER_MM)
scene.render.resolution_y = round(2 * HALF_H * PX_PER_MM)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "16"
scene.view_settings.view_transform = os.environ.get("VIEW", "Standard")
scene.view_settings.look = os.environ.get("LOOK", "None")
scene.view_settings.exposure = 0.0

# --- materials -------------------------------------------------------------
def principled(name, **inputs):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    node = material.node_tree.nodes["Principled BSDF"]
    for key, value in inputs.items(): node.inputs[key].default_value = value
    return material

def smudged(material, scale=1.0, amount=0.05):
    """Real chrome is handled: faint fingerprints and wiping marks in its gloss."""
    nodes, links = material.node_tree.nodes, material.node_tree.links
    bsdf = nodes["Principled BSDF"]
    base = bsdf.inputs["Roughness"].default_value
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 0.35 * scale
    noise.inputs["Detail"].default_value = 8
    noise.inputs["Roughness"].default_value = 0.62
    ramp = nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value = 0.45
    ramp.inputs["From Max"].default_value = 0.75
    ramp.inputs["To Min"].default_value = base
    ramp.inputs["To Max"].default_value = base + amount
    links.new(noise.outputs["Fac"], ramp.inputs["Value"])
    links.new(ramp.outputs["Result"], bsdf.inputs["Roughness"])
    return material

chrome = smudged(principled("chrome", **{"Base Color": (0.93, 0.93, 0.92, 1), "Metallic": 1.0, "Roughness": 0.055}))
satin = smudged(principled("satin chrome", **{"Base Color": (0.9, 0.9, 0.89, 1), "Metallic": 1.0, "Roughness": 0.16}), amount=0.04)
lacquer_rgb = {"black": (0.006, 0.006, 0.007, 1), "blue": (0.012, 0.014, 0.075, 1)}[color]
lacquer = principled("lacquer", **{"Base Color": lacquer_rgb, "Roughness": 0.35, "Specular IOR Level": 0.0, "Coat Weight": 1.0, "Coat Roughness": 0.035, "Coat IOR": 1.5})
smudged(lacquer, amount=0.0)
ring = principled("black plastic", **{"Base Color": (0.008, 0.008, 0.009, 1), "Roughness": 0.22})
cavity = principled("cavity", **{"Base Color": (0.01, 0.01, 0.01, 1), "Roughness": 0.6})
ink_rgb = {"black": (0.01, 0.01, 0.012, 1), "blue": (0.02, 0.03, 0.3, 1)}[color]
tube = principled("refill tube", **{"Base Color": ink_rgb, "Roughness": 0.25, "Coat Weight": 0.6, "Coat Roughness": 0.08})
point = principled("refill point", **{"Base Color": (0.86, 0.85, 0.82, 1), "Metallic": 1.0, "Roughness": 0.14})

# Chrome with the print (the ADD Gel label) on top.
printed = smudged(principled("printed chrome", **{"Base Color": (0.93, 0.93, 0.92, 1), "Metallic": 1.0, "Roughness": 0.055}))
nodes, links = printed.node_tree.nodes, printed.node_tree.links
metal = nodes["Principled BSDF"]
output = nodes["Material Output"]
texture = nodes.new("ShaderNodeTexImage")
texture.image = bpy.data.images.load(os.path.join(here, "print.png"))
texture.image.alpha_mode = "STRAIGHT"
texture.interpolation = "Cubic"
ink = nodes.new("ShaderNodeBsdfPrincipled")
ink.inputs["Roughness"].default_value = 0.42
ink.inputs["Coat Weight"].default_value = 0.35
ink.inputs["Coat Roughness"].default_value = 0.12
links.new(texture.outputs["Color"], ink.inputs["Base Color"])
mix = nodes.new("ShaderNodeMixShader")
links.new(texture.outputs["Alpha"], mix.inputs["Fac"])
links.new(metal.outputs["BSDF"], mix.inputs[1])
links.new(ink.outputs["BSDF"], mix.inputs[2])
links.new(mix.outputs["Shader"], output.inputs["Surface"])

# --- geometry --------------------------------------------------------------
def lathe(name, profile, material_at, close_start=True, close_end=True):
    """Revolve a profile [(x, r), ...] round the x axis. Angle φ runs from
    facing the viewer (+z) toward the top of the screen (+y); the barrel's
    print is unrolled the same way (v = ½ + φ/2π, u along x)."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    rings = []
    for x, r in profile:
        ring_verts = []
        for j in range(AROUND + 1):
            phi = -math.pi + 2 * math.pi * j / AROUND
            ring_verts.append(bm.verts.new((x, r * math.sin(phi), r * math.cos(phi))))
        rings.append(ring_verts)
    materials = []
    def material_index(m):
        if m not in materials: materials.append(m)
        return materials.index(m)
    for i in range(len(rings) - 1):
        x_mid = (profile[i][0] + profile[i + 1][0]) / 2
        index = material_index(material_at(x_mid, i))
        for j in range(AROUND):
            a, b, c, d = rings[i][j], rings[i][j + 1], rings[i + 1][j + 1], rings[i + 1][j]
            if a.co == d.co and b.co == c.co: continue
            face = bm.faces.new((a, d, c, b))
            face.material_index = index
            face.smooth = True
            for loop, (k, jj) in zip(face.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                loop[uv].uv = ((profile[k][0] - 74) / 52, jj / AROUND)
    def cap(ring_verts, x, index):
        centre = bm.verts.new((x, 0, 0))
        for j in range(AROUND):
            face = bm.faces.new((centre, ring_verts[j], ring_verts[j + 1]))
            face.material_index = index
    if close_start: cap(rings[0], profile[0][0], material_index(material_at(profile[0][0], 0)))
    if close_end: cap(rings[-1], profile[-1][0], material_index(material_at(profile[-1][0], len(profile) - 1)))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    for m in materials: mesh.materials.append(m)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj

# Body: the cone's open mouth (a lip turning into a dark bore) then the outside.
mouth = [(3.2, 0.74), (0.14, 0.74), (0.0, 0.86), (0.0, 1.12)]
body_profile = mouth + [tuple(p) for p in model["body"]]
inner = len(mouth) - 1
def body_material(x, i):
    if i < inner - 1: return cavity
    if x < 14.05: return chrome
    if x < 75.8: return lacquer
    if x < 122.6: return printed
    if x < 130.0: return chrome
    return ring
body = lathe("body", body_profile, body_material)
button = lathe("button", [tuple(p) for p in model["button"]], lambda x, i: satin)

# Refill, drawn with its point out of the cone.
travel = model["travel"]["refill"]
point_out = -2.3
refill_profile = [(point_out - 0.05, 0.0), (point_out, 0.13), (point_out + 0.12, 0.2), (point_out + 0.3, 0.24),
                  (-0.9, 0.5), (-0.6, 0.56), (-0.25, 0.56), (-0.2, 0.64), (14.0, 0.64)]
refill = lathe("refill", refill_profile, lambda x, i: point if x < -0.22 else tube)

# The wire clip: a strip of chrome lying along the barrel at the clip's angle,
# its free end rounded and touching the barrel, its top merging into the collar.
c = model["clip"]
A = -c["angle"]  # toward +y (the top of the screen)
d_hat, t_hat = Vector((0, math.sin(A), math.cos(A))), Vector((0, math.cos(A), -math.sin(A)))
x0, x1 = c["from"], c["to"]
w0, w1 = c["halfWidth"]
thickness = 2 * c["thickness"]
def smooth(a, b, x):
    t = min(1, max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
def clip_section(x):
    half = w0 + (w1 - w0) * (x - x0) / (x1 - x0)
    if x < x0 + w0: half *= math.sqrt(max(0, 1 - ((x0 + w0 - x) / w0) ** 2))
    gap = c["gap"][0] + (c["gap"][1] - c["gap"][0]) * smooth(x0 + 4, x0 + 10, x)
    inner_r = 4.32 + gap - (4.32 + gap - 4.36) * smooth(124.5, 127.5, x)
    outer_r = 4.32 + gap + thickness + 0.18 * smooth(124.5, 128.5, x)
    return half, inner_r, outer_r
clip_mesh = bpy.data.meshes.new("clip")
bm = bmesh.new()
K = 40
sections = []
x = x0
xs = []
while x < x1: xs.append(x); x += 0.08 if x < x0 + w0 + 0.5 else 0.25
xs.append(x1)
for x in xs:
    half, inner_r, outer_r = clip_section(x)
    mid, h = (inner_r + outer_r) / 2, (outer_r - inner_r) / 2
    corner = max(1e-4, min(0.32, half * 0.999, h * 0.999))
    ring_verts = []
    for k in range(K):
        theta = 2 * math.pi * k / K
        # rounded rectangle (superellipse-like via corner offsets)
        ct, st = math.cos(theta), math.sin(theta)
        t = (half - corner) * (1 if ct >= 0 else -1) + corner * ct if half > corner else half * ct
        u = (h - corner) * (1 if st >= 0 else -1) + corner * st if h > corner else h * st
        p = Vector((x, 0, 0)) + d_hat * (mid + u) + t_hat * t
        ring_verts.append(bm.verts.new(p))
    sections.append(ring_verts)
for i in range(len(sections) - 1):
    for k in range(K):
        face = bm.faces.new((sections[i][k], sections[i][(k + 1) % K], sections[i + 1][(k + 1) % K], sections[i + 1][k]))
        face.smooth = True
for ring_verts in (sections[0], sections[-1]):
    centre = bm.verts.new(sum((v.co for v in ring_verts), Vector()) / K)
    for k in range(K): bm.faces.new((centre, ring_verts[k], ring_verts[(k + 1) % K]))
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(clip_mesh)
bm.free()
clip_mesh.materials.append(chrome)
clip = bpy.data.objects.new("clip", clip_mesh)
scene.collection.objects.link(clip)

# --- the desk, the room and the light ---------------------------------------
desk_mesh = bpy.data.meshes.new("desk")
size = 1500
desk_mesh.from_pydata([(-size, -size, 0), (size, -size, 0), (size, size, 0), (-size, size, 0)], [], [(0, 1, 2, 3)])
desk = bpy.data.objects.new("desk", desk_mesh)
desk.location = (70, 0, -4.46)
desk.rotation_euler = (0, 0, math.radians(angle))  # the grain runs across the screen
scene.collection.objects.link(desk)
# The plain near-black surface it lies on (the page background, #111).
wood = principled("surface", **{"Base Color": (0.0056, 0.0056, 0.0056, 1), "Roughness": 0.7})
desk_mesh.materials.append(wood)
desk.visible_camera = False

world = bpy.data.worlds.new("room")
scene.world = world
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
background = wn["Background"]
a = math.radians(angle)
ox, oy, radius = LIGHT
# Ray offset in the pen's frame (x along the pen, y down the screen).
px = ox * math.cos(a) + oy * math.sin(a)
py = -ox * math.sin(a) + oy * math.cos(a)
to_light = Vector((-px, py, 1)).normalized()  # world y is up the screen
# The room the pen reflects, lit like the rest of the desk: soft daylight from
# the upper left (the photographed magnets and pushpins are lit the same way).
# A broad, bright window around the desk light's direction falls off into a
# dim room, so the chrome and lacquer carry one soft highlight on the side
# facing the light and darken away from it, rather than studio bands.
coords = wn.new("ShaderNodeTexCoord")
facing = wn.new("ShaderNodeVectorMath")
facing.operation = "DOT_PRODUCT"
facing.inputs[1].default_value = to_light
wl.new(coords.outputs["Generated"], facing.inputs[0])
toward = wn.new("ShaderNodeMapRange")
toward.inputs["From Min"].default_value = -1
toward.inputs["From Max"].default_value = 1
wl.new(facing.outputs["Value"], toward.inputs["Value"])
ramp = wn.new("ShaderNodeValToRGB")
stops = WINDOW
elements = ramp.color_ramp.elements
elements[0].position, elements[1].position = stops[0][0], stops[-1][0]
for position, value in stops[1:-1]: elements.new(position)
for element, (position, value) in zip(sorted(elements, key=lambda e: e.position), stops):
    element.color = (value * WARM[0], value * WARM[1], value * WARM[2], 1)
wl.new(toward.outputs["Result"], ramp.inputs["Fac"])
wl.new(ramp.outputs["Color"], background.inputs["Color"])
background.inputs["Strength"].default_value = ROOM_STRENGTH

sun_data = bpy.data.lights.new("desk light", "SUN")
sun_data.angle = 2 * math.atan(radius)
sun_data.energy = float(os.environ.get("SUN", 2.0))
sun_data.color = WARM
sun = bpy.data.objects.new("desk light", sun_data)
sun.rotation_euler = to_light.to_track_quat("Z", "Y").to_euler()
scene.collection.objects.link(sun)

# --- which layer ------------------------------------------------------------
layers = {"body": [body, clip], "button": [button], "refill": [refill]}
for name, objects in layers.items():
    for obj in objects: obj.visible_camera = name == part
if part != "refill": refill.hide_render = True
else: refill.location.x = 0

camera_data = bpy.data.cameras.new("camera")
camera_data.type = "ORTHO"
camera_data.ortho_scale = X1 - X0
camera = bpy.data.objects.new("camera", camera_data)
camera.location = ((X0 + X1) / 2, 0, 200)
camera_data.clip_end = 1000
scene.collection.objects.link(camera)
scene.camera = camera

scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("rendered", color, angle, part, "→", out)
