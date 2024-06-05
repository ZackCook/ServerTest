document.addEventListener("DOMContentLoaded", () => {
  const createClientForm = document.getElementById("createClientForm");
  const newMac = document.getElementById("newMac");
  const newType = document.getElementById("newType");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const selectedEntryLabel = document.getElementById("selectedClient");

  createClientForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    const newMacVal = newMac.value.trim();
    const newTypeVal = newType.value.trim();

    if (newMacVal && newTypeVal) {
      // Create a new option element
      const newOption = document.createElement("option");
      newOption.textContent = `${newTypeVal}:${newMacVal}`;
      newOption.value = `${newTypeVal}:${newMacVal}`;

      // Add the new option to the dropdown menu
      dropdownMenu.appendChild(newOption);

      // Clear the input fields
      newMac.value = "";
      newType.value = "";
    } else {
      alert("Please fill in both fields");
    }
  });

  dropdownMenu.addEventListener("change", function () {
    const selectedValue = this.value;
    selectedEntryLabel.textContent = selectedValue;
  });
});
