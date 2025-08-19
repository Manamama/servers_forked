
import os
import json
from multiprocessing import Process, Manager
from fixed_memory_manager import FixedKnowledgeGraphManager

TEST_FILE = 'test_memory_fixed.json'
LOCK_FILE = 'test_memory_fixed.lock'

# Initialize the manager once
manager = FixedKnowledgeGraphManager(TEST_FILE, LOCK_FILE)

def safe_operation(process_id, entities_to_add, relations_to_add, shared_dict):
    """Performs concurrent operations using the fixed manager."""
    try:
        manager.safe_create_entities(entities_to_add)
        manager.safe_create_relations(relations_to_add)
        shared_dict[process_id] = 'Success'
    except Exception as e:
        shared_dict[process_id] = f'Error: {type(e).__name__} - {e}'

def main():
    """Run two safe operations in parallel to verify the fix."""
    if os.path.exists(TEST_FILE):
        os.remove(TEST_FILE)

    with Manager() as process_manager:
        shared_dict = process_manager.dict()

        # Define data for two processes
        data_p1 = {
            'entities': [{'name': 'Human', 'entityType': 'Actor'}],
            'relations': [{'from': 'Human', 'to': 'Start_Bank', 'relationType': 'is_at'}]
        }
        data_p2 = {
            'entities': [{'name': 'Goat', 'entityType': 'Actor'}],
            'relations': [{'from': 'Goat', 'to': 'Start_Bank', 'relationType': 'is_at'}]
        }

        p1 = Process(target=safe_operation, args=(1, data_p1['entities'], data_p1['relations'], shared_dict))
        p2 = Process(target=safe_operation, args=(2, data_p2['entities'], data_p2['relations'], shared_dict))

        p1.start()
        p2.start()

        p1.join()
        p2.join()

        print("--- Process Results ---")
        for pid, result in shared_dict.items():
            print(f"Process {pid}: {result}")

        print("\n--- Final File Content ---")
        final_graph = manager._load_graph_safe()
        print(json.dumps(final_graph, indent=2))

        # Verify the result
        num_entities = len(final_graph.get('entities', []))
        num_relations = len(final_graph.get('relations', []))

        print(f"\nFound {num_entities} entities and {num_relations} relations.")

        if num_entities == 2 and num_relations == 2:
            print("\n*** BUG FIXED: All data was written successfully. ***")
        else:
            print(f"\n*** TEST FAILED: Data was lost. Expected 2 entities and 2 relations. ***")
        
        # Clean up
        if os.path.exists(TEST_FILE):
            os.remove(TEST_FILE)

if __name__ == '__main__':
    main()
