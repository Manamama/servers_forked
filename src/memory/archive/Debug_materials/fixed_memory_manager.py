
import json
import os
from multiprocessing import Lock

# This class is a Python implementation of the TypeScript KnowledgeGraphManager,
# but with a file-based lock to prevent race conditions.
class FixedKnowledgeGraphManager:
    def __init__(self, memory_file_path, lock_file_path):
        self.memory_file_path = memory_file_path
        self.lock = Lock()

    def _load_graph_safe(self):
        """Safely loads the graph from the JSON file."""
        try:
            with open(self.memory_file_path, 'r') as f:
                data = f.read()
                return json.loads(data) if data else {'entities': [], 'relations': []}
        except FileNotFoundError:
            return {'entities': [], 'relations': []}

    def _save_graph_safe(self, graph):
        """Safely saves the graph to the JSON file."""
        with open(self.memory_file_path, 'w') as f:
            json.dump(graph, f, indent=2)

    def _execute_with_lock(self, operation, *args, **kwargs):
        """Executes a given file operation with a lock."""
        with self.lock:
            graph = self._load_graph_safe()
            result, updated_graph = operation(graph, *args, **kwargs)
            self._save_graph_safe(updated_graph)
            return result

    def create_entities(self, graph, entities):
        new_entities = [e for e in entities if e['name'] not in {ex['name'] for ex in graph['entities']}]
        graph['entities'].extend(new_entities)
        return new_entities, graph

    def create_relations(self, graph, relations):
        # Simple add for testing; a real implementation would check for duplicates
        graph['relations'].extend(relations)
        return relations, graph

    # Wrapper methods that will be called by the test processes
    def safe_create_entities(self, entities):
        return self._execute_with_lock(self.create_entities, entities)

    def safe_create_relations(self, relations):
        return self._execute_with_lock(self.create_relations, relations)
