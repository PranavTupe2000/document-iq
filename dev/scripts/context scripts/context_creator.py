import os
import sys


def collect_files(base_dir):
    """
    Recursively collect .py, .yaml, and .yml files
    """
    collected = []

    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith((".py", ".yaml", ".yml")):
                full_path = os.path.join(root, file)
                collected.append(full_path)

    return collected


def write_combined_file(base_dir, files):
    dir_name = os.path.basename(os.path.abspath(base_dir))
    output_file = f"{dir_name}.txt"

    separator_main = "=" * 53
    separator_file = "-" * 91

    with open(output_file, "w", encoding="utf-8") as out:

        # Header
        out.write(f"{separator_main}\n")
        out.write(f"{dir_name} code\n")
        out.write(f"{separator_file}\n\n")

        for file_path in files:
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

    print(f"Combined file created: {output_file}")


def main():
    if len(sys.argv) != 2:
        print("Usage: python combine_code.py <directory_path>")
        return

    base_dir = sys.argv[1]

    if not os.path.isdir(base_dir):
        print("Error: Provided path is not a directory.")
        return

    files = collect_files(base_dir)

    if not files:
        print("No .py or .yaml files found.")
        return

    files.sort()  # alphabetical order

    write_combined_file(base_dir, files)


if __name__ == "__main__":
    main()