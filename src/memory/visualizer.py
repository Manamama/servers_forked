
import http.server
import socketserver
import json
import os
from plantuml import PlantUML
import io

PORT = 8000
JSON_FILE = '/home/zezen/Downloads/GitHub/servers_forked/src/memory/dist/memory.json'

def generate_puml_from_json(file_path):
    if not os.path.exists(file_path):
        return "@startuml\nskinparam rectangle {\n    backgroundColor #FF0000\n}\nrectangle \"Error: memory.json not found\" as e\n@enduml"

    entities = {}
    relations = []

    with open(file_path, 'r') as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get('type') == 'entity':
                    name = data.get('name')
                    if name:
                        alias = ''.join(e for e in name if e.isalnum())
                        entities[name] = {'alias': alias, 'data': data}
                elif data.get('type') == 'relation':
                    relations.append(data)
            except json.JSONDecodeError:
                continue

    puml_content = ['@startuml']
    puml_content.append('skinparam rectangle {')
    puml_content.append('  roundCorner 25')
    puml_content.append('}')
    puml_content.append('skinparam card {')
    puml_content.append('  roundCorner 25')
    puml_content.append('}')


    for name, entity_info in entities.items():
        alias = entity_info['alias']
        entity_data = entity_info['data']
        entity_type = entity_data.get('entityType', 'Entity')
        observations = entity_data.get('observations', [])
        
        label = f"=={entity_type}==\n**{name}**"
        if observations:
            label += "\n----"
            for obs in observations:
                label += f"\n- {obs}"

        puml_content.append(f'card \"{label}\" as {alias}')

    for relation in relations:
        from_entity = relation.get('from')
        to_entity = relation.get('to')
        relation_type = relation.get('relationType')

        if from_entity in entities and to_entity in entities:
            from_alias = entities[from_entity]['alias']
            to_alias = entities[to_entity]['alias']
            puml_content.append(f'{from_alias} --> {to_alias} : {relation_type}')

    puml_content.append('@enduml')
    return '\n'.join(puml_content)

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = """
            <html>
            <head>
                <title>Live PUML Visualizer</title>
                <meta http-equiv="refresh" content="5">
            </head>
            <body>
                <h1>PlantUML Visualization</h1>
                <img src="/diagram.svg" alt="PlantUML Diagram">
            </body>
            </html>
            """
            self.wfile.write(html.encode('utf-8'))
        elif self.path == '/diagram.svg':
            puml_text = generate_puml_from_json(JSON_FILE)
            
            pl = PlantUML(url='http://www.plantuml.com/plantuml')
            
            try:
                svg_data = pl.processes(puml_text, "svg")
                self.send_response(200)
                self.send_header('Content-type', 'image/svg+xml')
                self.end_headers()
                self.wfile.write(svg_data)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(f"Error generating diagram: {e}".encode('utf-8'))
        else:
            super().do_GET()

with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
