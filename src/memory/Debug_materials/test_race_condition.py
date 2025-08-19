
import json
import os
from multiprocessing import Process, Manager

# The file to be shared and potentially corrupted
TEST_FILE = 'test_memory.json'

# This function simulates the buggy load/save logic from the TypeScript code
def buggy_operation(process_id, new_entry, shared_dict):
    """Simulates a single process reading, updating, and writing the file."""
    try:
        # 1. Load the graph (read from file)
        try:
            with open(TEST_FILE, 'r') as f:
                data = f.read()
                # In a race condition, this data could be incomplete
                graph = json.loads(data) if data else {'entries': []}
        except (FileNotFoundError, json.JSONDecodeError):
            graph = {'entries': []}

        # 2. Add the new entry
        graph['entries'].append(new_entry)
        
        # 3. Save the graph (write back to file)
        with open(TEST_FILE, 'w') as f:
            # This is the critical section where the race condition happens.
            # One process can overwrite the other's changes.
            json.dump(graph, f)
        
        shared_dict[process_id] = 'Success'

    except Exception as e:
        # If a json.JSONDecodeError happens, it means we read a corrupted file
        shared_dict[process_id] = f'Error: {type(e).__name__} - {e}'

def main():
    """Run two buggy operations in parallel to try and trigger the race condition."""
    # Clean up previous test file if it exists
    if os.path.exists(TEST_FILE):
        os.remove(TEST_FILE)

    with Manager() as manager:
        shared_dict = manager.dict()
        
        # Create two processes that will run the buggy operation concurrently
        p1 = Process(target=buggy_operation, args=(1, {'id': 1, 'data': 'from_process_1'}, shared_dict))
        p2 = Process(target=buggy_operation, args=(2, {'id': 2, 'data': 'from_process_2'}, shared_dict))

        p1.start()
        p2.start()

        p1.join()
        p2.join()

        print("--- Process Results ---")
        for pid, result in shared_dict.items():
            print(f"Process {pid}: {result}")

        print("\n--- Final File Content ---")
        try:
            with open(TEST_FILE, 'r') as f:
                content = f.read()
                print(content)
                # Final check: is the file valid JSON?
                final_data = json.loads(content)
                print("\n--- Final Parsed Data ---")
                print(final_data)
                if len(final_data.get('entries', [])) != 2:
                    print("\n*** BUG CONFIRMED: Data was lost. Expected 2 entries. ***")
                else:
                    print("\n*** TEST PASSED (Race condition not triggered this time) ***")

        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"*** BUG CONFIRMED: File is corrupted or does not exist. ***")
            print(f"Error: {e}")
        finally:
             # Clean up the test file
            if os.path.exists(TEST_FILE):
                os.remove(TEST_FILE)


if __name__ == '__main__':
    main()
