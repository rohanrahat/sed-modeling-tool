import json

def convert_bc03_to_json(input_file, output_file):
    with open(input_file, 'r') as f:
        lines = f.readlines()

    data = {
        "wavelengths": [],
        "models": {
            "1Myr": [],
            "10Myr": [],
            "100Myr": [],
            "1000Myr": [],
            "5000Myr": [],
            "10000Myr": []
        }
    }

    for line in lines:
        values = line.strip().split()
        data["wavelengths"].append(float(values[0]))
        data["models"]["1Myr"].append(float(values[1]))
        data["models"]["10Myr"].append(float(values[2]))
        data["models"]["100Myr"].append(float(values[3]))
        data["models"]["1000Myr"].append(float(values[4]))
        data["models"]["5000Myr"].append(float(values[5]))
        data["models"]["10000Myr"].append(float(values[6]))

    with open(output_file, 'w') as f:
        json.dump(data, f)

if __name__ == "__main__":
    convert_bc03_to_json("public/bc03_models.txt", "public/bc03_models.json")

print("Conversion complete. JSON file created in the public folder.")
