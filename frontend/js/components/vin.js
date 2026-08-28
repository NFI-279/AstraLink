const VIN_STORAGE_KEY =
    "astralink.vehicle.vin";


let vinInitialized =
    false;


export function initializeVin() {

    if (
        vinInitialized
    ) {
        return;
    }


    const backdrop =
        document.getElementById(
            "vinBackdrop"
        );


    const input =
        document.getElementById(
            "vinInput"
        );


    const saveButton =
        document.getElementById(
            "saveVin"
        );


    const removeButton =
        document.getElementById(
            "removeVin"
        );


    const counter =
        document.getElementById(
            "vinCounter"
        );


    const error =
        document.getElementById(
            "vinError"
        );


    if (
        !backdrop
        || !input
        || !saveButton
    ) {
        return;
    }


    vinInitialized =
        true;


    restoreStoredVin();


    document.addEventListener(
        "click",
        event => {

            const openButton =
                event.target.closest(
                    "[data-open-vin]"
                );


            if (
                openButton
            ) {

                openVinSheet(
                    backdrop,
                    input,
                    removeButton
                );

                return;

            }


            const closeButton =
                event.target.closest(
                    "[data-close-vin]"
                );


            if (
                closeButton
            ) {

                closeVinSheet(
                    backdrop
                );

            }

        }
    );


    backdrop.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                backdrop
            ) {

                closeVinSheet(
                    backdrop
                );

            }

        }
    );


    input.addEventListener(
        "input",
        () => {

            sanitizeVinInput(
                input
            );


            updateVinState(
                input,
                counter,
                saveButton,
                error
            );

        }
    );


    saveButton.addEventListener(
        "click",
        () => {

            saveVin(
                input,
                backdrop,
                error,
                removeButton
            );

        }
    );


    removeButton
        ?.addEventListener(
            "click",
            () => {

                removeVin(
                    input,
                    backdrop,
                    counter,
                    saveButton,
                    error,
                    removeButton
                );

            }
        );


    updateVinState(
        input,
        counter,
        saveButton,
        error
    );

}


function sanitizeVinInput(
    input
) {

    input.value =
        input.value
            .toUpperCase()
            .replace(
                /[^A-Z0-9]/g,
                ""
            )
            .slice(
                0,
                17
            );

}


function isValidVin(
    vin
) {

    return /^[A-HJ-NPR-Z0-9]{17}$/
        .test(
            vin
        );

}


function updateVinState(
    input,
    counter,
    saveButton,
    error
) {

    const vin =
        input.value
            .trim()
            .toUpperCase();


    if (
        counter
    ) {

        counter.textContent =
            `${vin.length} / 17`;

    }


    const valid =
        isValidVin(
            vin
        );


    saveButton.disabled =
        !valid;


    input.classList.toggle(
        "invalid",
        vin.length > 0
        && !valid
    );


    if (
        vin.length === 0
    ) {

        hideError(
            error
        );

        return;

    }


    if (
        /[IOQ]/.test(
            vin
        )
    ) {

        showError(
            error,
            "VINs cannot contain I, O or Q."
        );

        return;

    }


    if (
        vin.length < 17
    ) {

        showError(
            error,
            "VIN must contain exactly 17 characters."
        );

        return;

    }


    if (
        !valid
    ) {

        showError(
            error,
            "Enter a valid 17-character VIN."
        );

        return;

    }


    hideError(
        error
    );

}


function openVinSheet(
    backdrop,
    input,
    removeButton
) {

    const storedVin =
        getStoredVin();


    input.value =
        storedVin
        ?? "";


    if (
        removeButton
    ) {

        removeButton.classList.toggle(
            "hidden",
            !storedVin
        );

    }


    backdrop.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "vin-open"
    );


    setTimeout(
        () => {

            input.focus();

            input.setSelectionRange(
                input.value.length,
                input.value.length
            );

        },
        120
    );

}


function closeVinSheet(
    backdrop
) {

    backdrop.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "vin-open"
    );

}


function saveVin(
    input,
    backdrop,
    error,
    removeButton
) {

    const vin =
        input.value
            .trim()
            .toUpperCase();


    if (
        !isValidVin(
            vin
        )
    ) {

        showError(
            error,
            "Enter a valid 17-character VIN."
        );

        return;

    }


    localStorage.setItem(
        VIN_STORAGE_KEY,
        vin
    );


    updateVehicleVin(
        vin
    );


    if (
        removeButton
    ) {

        removeButton.classList.remove(
            "hidden"
        );

    }


    closeVinSheet(
        backdrop
    );


    showToast(
        "VIN saved"
    );

}


function removeVin(
    input,
    backdrop,
    counter,
    saveButton,
    error,
    removeButton
) {

    localStorage.removeItem(
        VIN_STORAGE_KEY
    );


    input.value =
        "";


    updateVehicleVin(
        null
    );


    updateVinState(
        input,
        counter,
        saveButton,
        error
    );


    removeButton
        ?.classList
        .add(
            "hidden"
        );


    closeVinSheet(
        backdrop
    );


    showToast(
        "VIN removed"
    );

}


function restoreStoredVin() {

    const vin =
        getStoredVin();


    updateVehicleVin(
        vin
    );

}


function getStoredVin() {

    const value =
        localStorage.getItem(
            VIN_STORAGE_KEY
        );


    if (
        !value
    ) {
        return null;
    }


    const vin =
        value
            .trim()
            .toUpperCase();


    if (
        !isValidVin(
            vin
        )
    ) {

        localStorage.removeItem(
            VIN_STORAGE_KEY
        );

        return null;

    }


    return vin;

}


function updateVehicleVin(
    vin
) {

    const vehicleVin =
        document.getElementById(
            "vehicleVin"
        );


    if (
        vehicleVin
    ) {

        vehicleVin.textContent =
            vin
            ?? "Not configured";

    }

}


function showError(
    element,
    message
) {

    if (
        !element
    ) {
        return;
    }


    element.textContent =
        message;


    element.classList.remove(
        "hidden"
    );

}


function hideError(
    element
) {

    if (
        !element
    ) {
        return;
    }


    element.textContent =
        "";


    element.classList.add(
        "hidden"
    );

}


function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (
        !toast
    ) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.vinToastTimer
    );


    window.vinToastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            1700
        );

}