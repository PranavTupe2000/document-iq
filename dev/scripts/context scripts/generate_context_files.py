import os


# ---------- Reusable Logic (from previous script) ----------

def collect_files(base_dir):
    """
    Recursively collect .py, .yaml, and .yml files
    """
    collected = []

    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith((".py", ".yaml", ".yml", ".js", ".html", ".css")):
                full_path = os.path.join(root, file)
                collected.append(full_path)

    return collected


def write_combined_file(base_dir, files, output_folder):
    dir_name = os.path.basename(os.path.abspath(base_dir))
    output_file = os.path.join(output_folder, f"{dir_name}.txt")

    separator_main = "=" * 53
    separator_file = "-" * 91

    with open(output_file, "w", encoding="utf-8") as out:

        # Header
        out.write(f"{separator_main}\n")
        out.write(f"{dir_name} code\n")
        out.write(f"{separator_file}\n\n")

        for file_path in sorted(files):
            relative_path = os.path.relpath(file_path, base_dir)
            file_name = os.path.basename(file_path)

            out.write(f"{separator_file}\n")
            out.write(f"Path: {relative_path}\n")
            out.write(f"File: {file_name}\n\n")

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception as e:
                content = f"[ERROR READING FILE: {e}]"

            out.write(content + "\n\n")

        out.write(f"{separator_main}\n")

    print(f"Created: {output_file}")


# ---------- New Wrapper Logic ----------

def read_paths_from_file(file_path):
    """
    Read directory paths from context_dir_path.txt
    """
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return []

    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Remove empty lines and strip spaces
    paths = [line.strip() for line in lines if line.strip()]
    return paths


def main():
    context_list_file = "dev\scripts\context scripts\context_dir_path.txt"
    output_folder = "context"

    # Create context folder if not exists
    os.makedirs(output_folder, exist_ok=True)

    paths = read_paths_from_file(context_list_file)

    if not paths:
        print("No valid paths found.")
        return

    for path in paths:
        if not os.path.isdir(path):
            print(f"Skipping (not a directory): {path}")
            continue

        print(f"Processing: {path}")
        files = collect_files(path)

        if not files:
            print(f"No valid files found in {path}")
            continue

        write_combined_file(path, files, output_folder)


if __name__ == "__main__":
    main()