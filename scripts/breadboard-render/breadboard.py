"""Model and path-trace a full-size solderless breadboard in Blender (Cycles).

    blender -b --factory-startup --python breadboard.py -- <angle°> <out.png> [samples]

Geometry from model.json (src/lib/breadboardModel.ts, via export-model.ts),
all in millimetres: the board's length along x, centred on the origin, its
base on the desk at z = 0, z toward the viewer. A matte white ABS body with
softened edges; 830 square holes cut into it (terminal strip and power rails)
and the centre channel, their walls dark where they drop away into the clips;
the red and blue rail stripes, +/− marks, column numbers and row letters
printed on top. Lit like the pens (scripts/pen-render/pen.py): the site's desk
light as a sun turned into the board's frame for a board turned `angle`
degrees on screen, in a dim warm room, over the page's #111 surface. Looking
straight down, orthographic; one transparent layer. Its shadow is the page's.
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Matrix, Vector

here = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[sys.argv.index("--") + 1:]
angle, out = float(args[0]), args[1]
samples = int(args[2]) if len(args) > 2 else 256
b = json.load(open(os.path.join(here, "model.json")))

# Frame (mm) and resolution: 6.5 px per mm, a whole number of pixels (1131 × 390).
HALF_W, HALF_H, PX_PER_MM = 87.0, 30.0, 6.5
LIGHT = (0.35, 0.45, 0.11)
WARM = (1.0, 0.95, 0.8)
ROOM_STRENGTH = 0.7
WINDOW = [[0, 0.05], [0.5, 0.1], [0.78, 0.28], [0.9, 0.95], [0.96, 2.0], [1, 2.4]]

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
scene.render.film_transparent = True
scene.render.resolution_x = round(2 * HALF_W * PX_PER_MM)
scene.render.resolution_y = round(2 * HALF_H * PX_PER_MM)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "16"
scene.view_settings.view_transform = "Standard"

def principled(name, **inputs):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    node = material.node_tree.nodes["Principled BSDF"]
    for key, value in inputs.items(): node.inputs[key].default_value = value
    return material

# Slightly warm white ABS, a soft satin sheen, a little light through it.
abs_white = principled("ABS", **{"Base Color": (0.88, 0.88, 0.86, 1), "Roughness": 0.4,
    "Subsurface Weight": 0.06, "Subsurface Radius": (0.6, 0.6, 0.5), "Subsurface Scale": 0.4})
# Fine moulding texture: faint bumps in the gloss.
nodes, links = abs_white.node_tree.nodes, abs_white.node_tree.links
noise = nodes.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 3.0; noise.inputs["Detail"].default_value = 10
bump = nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.04; bump.inputs["Distance"].default_value = 0.02
links.new(noise.outputs["Fac"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], nodes["Principled BSDF"].inputs["Normal"])
cavity = principled("cavity", **{"Base Color": (0.1, 0.1, 0.1, 1), "Roughness": 0.55})
ink = principled("ink", **{"Base Color": (0.06, 0.06, 0.07, 1), "Roughness": 0.6})
red = principled("red", **{"Base Color": (0.62, 0.04, 0.03, 1), "Roughness": 0.5})
blue = principled("blue", **{"Base Color": (0.03, 0.12, 0.5, 1), "Roughness": 0.5})

L, W, H = b["length"], b["width"], b["height"]

# --- the body: a rounded block -------------------------------------------------
bpy.ops.mesh.primitive_cube_add(size=1)
body = bpy.context.active_object
body.name = "body"
body.scale = (L, W, H)
body.location = (0, 0, H / 2)
bpy.ops.object.transform_apply(scale=True)
bevel = body.modifiers.new("edges", "BEVEL")
bevel.width = b["corner"]
bevel.segments = 5
bpy.ops.object.modifier_apply(modifier="edges")
body.data.materials.append(abs_white)

# --- what is cut away: holes (each with a small lead-in), the channel -------
pitch, hole = b["pitch"], b["hole"]
def cutter_object(name, material, cuts):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    for x, y, sx, sy, depth in cuts:
        m = Matrix.Translation((x, y, H - depth / 2 + 0.3)) @ Matrix.Diagonal((sx, sy, depth + 0.6, 1))
        bmesh.ops.create_cube(bm, size=1, matrix=m)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    mesh.materials.append(material)
    obj.hide_render = True
    obj.display_type = "WIRE"
    modifier = body.modifiers.new(name, "BOOLEAN")
    modifier.operation = "DIFFERENCE"
    modifier.solver = "EXACT"
    modifier.object = obj
    # Cut faces take the cutter's material.
    modifier.material_mode = "TRANSFER"
columns = b["columns"]
xs = [(i - (columns - 1) / 2) * pitch for i in range(columns)]
slots = b["railGroups"] * 6 - 1
rail_xs = [(i - (slots - 1) / 2) * pitch for i in range(slots) if i % 6 != 5]
points = [(x, side * (b["channel"] + row * pitch)) for x in xs for side in (-1, 1) for row in range(b["rows"])]
points += [(x, side * y) for x in rail_xs for side in (-1, 1) for y in b["rails"]]
# A shallow square lead-in in the white plastic, then the dark hole into the clip.
cutter_object("lead-in", abs_white, [(x, y, hole + 0.45, hole + 0.45, 0.28) for x, y in points])
cutter_object("holes", cavity, [(x, y, hole, hole, 2.6) for x, y in points])
# The centre channel: a shallow groove in the same plastic (a DIP straddles it).
cutter_object("channel", abs_white, [(0, 0, L - 9, 2.2, 1.6)])

# --- the print ---------------------------------------------------------------
top = H + 0.01
def strip(x0, x1, y, w, material):
    mesh = bpy.data.meshes.new("strip")
    mesh.from_pydata([(x0, y - w / 2, top), (x1, y - w / 2, top), (x1, y + w / 2, top), (x0, y + w / 2, top)], [], [(0, 1, 2, 3)])
    mesh.materials.append(material)
    scene.collection.objects.link(bpy.data.objects.new("strip", mesh))
def text(body_text, x, y, size, material, turn=0.0):
    curve = bpy.data.curves.new("text", "FONT")
    curve.body = body_text
    curve.size = size
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    obj = bpy.data.objects.new("text", curve)
    obj.location = (x, y, top)
    obj.rotation_euler = (0, 0, turn)
    curve.materials.append(material)
    scene.collection.objects.link(obj)
span = (rail_xs[-1] - rail_xs[0]) / 2 + 2
for side in (-1, 1):
    inner, outer = b["rails"]
    # − rail beside its blue stripe (inner), + rail beside its red stripe (outer).
    strip(-span, span, side * (inner - 1.6), 0.45, blue)
    strip(-span, span, side * (outer + 1.6), 0.45, red)
    for end in (-1, 1):
        text("−", end * (span + 2.2), side * inner, 1.9, blue)
        text("+", end * (span + 2.2), side * outer, 1.9, red)
# Column numbers beside rows a and j; row letters at both ends.
edge = b["channel"] + (b["rows"] - 1) * pitch + 1.9
for i, x in enumerate(xs):
    n = i + 1
    if n == 1 or n % 5 == 0:
        for side in (-1, 1):
            text(str(n), x, side * edge, 1.25, ink)
letters = "abcdefghij"
for end in (-1, 1):
    for k in range(b["rows"]):
        x = end * (xs[-1] + 2.6)
        text(letters[4 - k], x, -(b["channel"] + k * pitch), 1.3, ink)
        text(letters[5 + k], x, b["channel"] + k * pitch, 1.3, ink)

# --- desk, room, light (as for the pens) ---------------------------------------
desk_mesh = bpy.data.meshes.new("desk")
size = 1500
desk_mesh.from_pydata([(-size, -size, 0), (size, -size, 0), (size, size, 0), (-size, size, 0)], [], [(0, 1, 2, 3)])
desk = bpy.data.objects.new("desk", desk_mesh)
scene.collection.objects.link(desk)
desk_mesh.materials.append(principled("surface", **{"Base Color": (0.0056, 0.0056, 0.0056, 1), "Roughness": 0.7}))
desk.visible_camera = False

world = bpy.data.worlds.new("room")
scene.world = world
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
background = wn["Background"]
a = math.radians(angle)
ox, oy, radius = LIGHT
px = ox * math.cos(a) + oy * math.sin(a)
py = -ox * math.sin(a) + oy * math.cos(a)
to_light = Vector((-px, py, 1)).normalized()
coords = wn.new("ShaderNodeTexCoord")
facing = wn.new("ShaderNodeVectorMath"); facing.operation = "DOT_PRODUCT"; facing.inputs[1].default_value = to_light
wl.new(coords.outputs["Generated"], facing.inputs[0])
toward = wn.new("ShaderNodeMapRange"); toward.inputs["From Min"].default_value = -1; toward.inputs["From Max"].default_value = 1
wl.new(facing.outputs["Value"], toward.inputs["Value"])
ramp = wn.new("ShaderNodeValToRGB")
elements = ramp.color_ramp.elements
elements[0].position, elements[1].position = WINDOW[0][0], WINDOW[-1][0]
for position, value in WINDOW[1:-1]: elements.new(position)
for element, (position, value) in zip(sorted(elements, key=lambda e: e.position), WINDOW):
    element.color = (value * WARM[0], value * WARM[1], value * WARM[2], 1)
wl.new(toward.outputs["Result"], ramp.inputs["Fac"])
wl.new(ramp.outputs["Color"], background.inputs["Color"])
background.inputs["Strength"].default_value = ROOM_STRENGTH
sun_data = bpy.data.lights.new("desk light", "SUN")
sun_data.angle = 2 * math.atan(radius)
sun_data.energy = 2.0
sun_data.color = WARM
sun = bpy.data.objects.new("desk light", sun_data)
sun.rotation_euler = to_light.to_track_quat("Z", "Y").to_euler()
scene.collection.objects.link(sun)

camera_data = bpy.data.cameras.new("camera")
camera_data.type = "ORTHO"
camera_data.ortho_scale = 2 * HALF_W
camera = bpy.data.objects.new("camera", camera_data)
camera.location = (0, 0, 200)
camera_data.clip_end = 1000
scene.collection.objects.link(camera)
scene.camera = camera

scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("rendered breadboard", angle, "→", out)
