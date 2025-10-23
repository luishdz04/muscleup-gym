import PyPDF2
import re
import json

# Abrir el PDF
pdf = open('BIBLIOTECA DE EJERCICIOS MUPAI.pdf', 'rb')
reader = PyPDF2.PdfReader(pdf)

print(f"Total de páginas: {len(reader.pages)}\n")

# Extraer todo el texto
full_text = ""
for i, page in enumerate(reader.pages):
    full_text += page.extract_text()

# Buscar todos los ejercicios numerados (patrón: número. Nombre del ejercicio)
ejercicios_pattern = r'^(\d+)\.\s+([^\n]+?)(?:\s*\(([^\)]+)\))?$'
todos_ejercicios = re.findall(ejercicios_pattern, full_text, re.MULTILINE)

print(f"=== TOTAL DE EJERCICIOS ENCONTRADOS: {len(todos_ejercicios)} ===\n")

# Detectar grupos musculares (aparecen como títulos centrados)
# Buscamos líneas que contengan solo el nombre del grupo
grupos_conocidos = [
    "Cuádriceps", "Glúteos", "Isquiotibiales", "Aductores", "Gemelos", 
    "Recto abdominal", "Oblicuos", "Dorsal", "Pectorales", "Hombros", 
    "Bíceps", "Tríceps", "Antebrazos", "Trapecio", "Espalda baja"
]

grupos_encontrados = {}
current_grupo = None

# Dividir por líneas y buscar grupos
lines = full_text.split('\n')
for i, line in enumerate(lines):
    line_clean = line.strip()
    
    # Verificar si es un grupo muscular
    for grupo in grupos_conocidos:
        if line_clean == grupo or line_clean.upper() == grupo.upper():
            current_grupo = grupo
            if current_grupo not in grupos_encontrados:
                grupos_encontrados[current_grupo] = []
            break

print("=== GRUPOS MUSCULARES DETECTADOS ===")
for i, grupo in enumerate(grupos_encontrados.keys(), 1):
    print(f"{i}. {grupo}")

# Mostrar primeros 20 ejercicios como ejemplo
print("\n=== PRIMEROS 30 EJERCICIOS ===")
for num, nombre, detalle in todos_ejercicios[:30]:
    print(f"{num}. {nombre} {f'({detalle})' if detalle else ''}")

# Guardar estructura en JSON
estructura = {
    "total_ejercicios": len(todos_ejercicios),
    "grupos_musculares": list(grupos_encontrados.keys()),
    "ejercicios_muestra": [
        {
            "numero": num,
            "nombre": nombre,
            "detalle": detalle
        } for num, nombre, detalle in todos_ejercicios[:50]
    ]
}

with open('scripts/estructura_biblioteca.json', 'w', encoding='utf-8') as f:
    json.dump(estructura, f, ensure_ascii=False, indent=2)

pdf.close()

print("\n✅ Análisis completado. Estructura guardada en scripts/estructura_biblioteca.json")
