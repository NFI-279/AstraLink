const toast = document.getElementById("toast");
const statusBackdrop =
    document.getElementById("statusBackdrop");
const fuelBackdrop =
    document.getElementById("fuelBackdrop");

let toastTimer;
let currentPrice = 7.42;

const litersToFull = 25.6;


export function initializeVehiclePage() {
    initializeVehicleActions();
    initializeSheets();
    initializeFuel();
    initializeRemoteServices();
    initializeZoomPrevention();
}


function initializeVehicleActions() {
    document.addEventListener(
        "click",
        handleVehicleClick
    );
}


function handleVehicleClick(event) {
    const target =
        event.target.closest(
            [
                "#openStatusModal",
                "#openFuelModal",
                "#serviceToggle",
                "#minusPrice",
                "#plusPrice",
                '[data-close="status"]',
                '[data-close="fuel"]',
                "[data-toast]",
                "#statusToLocation"
            ].join(", ")
        );


    if (!target) {
        return;
    }


    if (
        target.id ===
        "openStatusModal"
    ) {
        openSheet(
            statusBackdrop
        );

        return;
    }


    if (
        target.id ===
        "openFuelModal"
    ) {
        openSheet(
            fuelBackdrop
        );

        return;
    }


    if (
        target.matches(
            '[data-close="status"]'
        )
    ) {
        closeSheet(
            statusBackdrop
        );

        return;
    }


    if (
        target.matches(
            '[data-close="fuel"]'
        )
    ) {
        closeSheet(
            fuelBackdrop
        );

        return;
    }


    if (
        target.id ===
        "serviceToggle"
    ) {
        toggleRemoteServices(
            target
        );

        return;
    }


    if (
        target.id ===
        "minusPrice"
    ) {
        currentPrice =
            Math.max(
                0,
                currentPrice - 0.05
            );

        updateFuel();

        return;
    }


    if (
        target.id ===
        "plusPrice"
    ) {
        currentPrice +=
            0.05;

        updateFuel();

        return;
    }


    if (
        target.id ===
        "statusToLocation"
    ) {
        closeSheet(
            statusBackdrop
        );

        showToast(
            "Location page will be connected next"
        );

        return;
    }


    if (
        target.dataset.toast
    ) {
        showToast(
            target.dataset.toast
        );
    }
}


function initializeSheets() {
    [
        statusBackdrop,
        fuelBackdrop
    ].forEach(backdrop => {

        if (!backdrop) {
            return;
        }


        backdrop.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    backdrop
                ) {
                    closeSheet(
                        backdrop
                    );
                }

            }
        );


        attachSheetDrag(
            backdrop
        );

    });
}


function openSheet(backdrop) {
    if (!backdrop) {
        return;
    }

    backdrop.classList.remove(
        "hidden"
    );
}


function closeSheet(backdrop) {
    if (!backdrop) {
        return;
    }

    backdrop.classList.add(
        "hidden"
    );
}


function initializeFuel() {
    updateFuel();
}


function updateFuel() {
    const priceValue =
        document.getElementById(
            "priceValue"
        );

    const refillValue =
        document.getElementById(
            "refillValue"
        );


    if (priceValue) {
        priceValue.textContent =
            currentPrice.toFixed(2);
    }


    if (refillValue) {
        refillValue.textContent =
            `${
                (
                    currentPrice
                    * litersToFull
                ).toFixed(2)
            } RON`;
    }
}


function initializeRemoteServices() {
    const toggle =
        document.getElementById(
            "serviceToggle"
        );

    const services =
        document.getElementById(
            "remoteServices"
        );


    if (
        !toggle
        || !services
    ) {
        return;
    }


    toggle.setAttribute(
        "aria-expanded",
        "true"
    );
}


function toggleRemoteServices(
    toggle
) {
    const services =
        document.getElementById(
            "remoteServices"
        );


    if (!services) {
        return;
    }


    const expanded =
        toggle.getAttribute(
            "aria-expanded"
        ) === "true";


    toggle.setAttribute(
        "aria-expanded",
        String(!expanded)
    );


    services.classList.toggle(
        "collapsed",
        expanded
    );
}


function showToast(message) {
    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            1700
        );
}


function attachSheetDrag(
    backdrop
) {
    const sheet =
        backdrop.querySelector(
            ".draggable-sheet, .sheet"
        );


    if (!sheet) {
        return;
    }


    let startY = null;
    let currentY = null;


    function reset() {
        sheet.style.transition =
            "";

        sheet.style.transform =
            "";

        startY =
            null;

        currentY =
            null;
    }


    function begin(y) {
        startY =
            y;

        currentY =
            y;

        sheet.style.transition =
            "none";
    }


    function move(y) {
        if (
            startY ===
            null
        ) {
            return;
        }


        currentY =
            y;


        const delta =
            Math.max(
                0,
                currentY - startY
            );


        sheet.style.transform =
            `translateY(${delta}px)`;
    }


    function end() {
        if (
            startY ===
            null
        ) {
            return;
        }


        const delta =
            Math.max(
                0,
                (
                    currentY
                    ?? startY
                )
                - startY
            );


        sheet.style.transition =
            "transform 180ms ease";


        if (
            delta > 70
        ) {
            closeSheet(
                backdrop
            );


            setTimeout(
                reset,
                180
            );

            return;
        }


        sheet.style.transform =
            "translateY(0)";


        setTimeout(
            reset,
            180
        );
    }


    sheet.addEventListener(
        "touchstart",
        event => {

            begin(
                event
                    .touches[0]
                    .clientY
            );

        },
        {
            passive: true
        }
    );


    sheet.addEventListener(
        "touchmove",
        event => {

            move(
                event
                    .touches[0]
                    .clientY
            );

        },
        {
            passive: true
        }
    );


    sheet.addEventListener(
        "touchend",
        end
    );
}


function initializeZoomPrevention() {
    document.addEventListener(
        "gesturestart",
        event => {

            event.preventDefault();

        },
        {
            passive: false
        }
    );
}