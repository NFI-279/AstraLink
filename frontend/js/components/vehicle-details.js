let vehicleDetailsInitialized = false;


export function initializeVehicleDetails() {

    if (vehicleDetailsInitialized) {
        return;
    }


    const backdrop =
        document.getElementById(
            "vehicleDetailsBackdrop"
        );


    const sheet =
        document.getElementById(
            "vehicleDetailsSheet"
        );


    const grabber =
        sheet?.querySelector(
            ".grabber"
        );


    if (
        !backdrop
        || !sheet
    ) {

        console.warn(
            "Vehicle Details component was not found."
        );

        return;

    }


    vehicleDetailsInitialized = true;


    /*
     * Open Vehicle Details.
     *
     * Both the top vehicle profile card and
     * any element using this settings action
     * will open the same sheet.
     */
    document.addEventListener(
        "click",
        event => {

            const openButton =
                event.target.closest(
                    '[data-settings-action="vehicle-details"]'
                );


            if (!openButton) {
                return;
            }


            openVehicleDetails(
                backdrop
            );

        }
    );


    /*
     * Close buttons.
     *
     * This includes both the X button and
     * the grabber button if it is clicked.
     */
    document.addEventListener(
        "click",
        event => {

            const closeButton =
                event.target.closest(
                    "[data-close-vehicle-details]"
                );


            if (!closeButton) {
                return;
            }


            closeVehicleDetails(
                backdrop,
                sheet
            );

        }
    );


    /*
     * Clicking the darkened area outside
     * the sheet closes it.
     */
    backdrop.addEventListener(
        "click",
        event => {

            if (
                event.target !==
                backdrop
            ) {
                return;
            }


            closeVehicleDetails(
                backdrop,
                sheet
            );

        }
    );


    /*
     * Drag-to-dismiss is attached ONLY to
     * the grabber.
     *
     * The scrollable content remains free
     * to scroll normally.
     */
    if (grabber) {

        initializeVehicleDetailsDrag(
            grabber,
            sheet,
            backdrop
        );

    }

}


function openVehicleDetails(
    backdrop
) {

    backdrop.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "vehicle-details-open"
    );

}


function closeVehicleDetails(
    backdrop,
    sheet
) {

    backdrop.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "vehicle-details-open"
    );


    if (sheet) {

        sheet.style.transition =
            "";

        sheet.style.transform =
            "";

    }

}


function initializeVehicleDetailsDrag(
    grabber,
    sheet,
    backdrop
) {

    let startY = null;

    let currentY = null;


    function begin(
        clientY
    ) {

        startY =
            clientY;

        currentY =
            clientY;


        sheet.style.transition =
            "none";

    }


    function move(
        clientY
    ) {

        if (
            startY ===
            null
        ) {
            return;
        }


        currentY =
            clientY;


        const distance =
            Math.max(
                0,
                currentY - startY
            );


        sheet.style.transform =
            `translateY(${distance}px)`;

    }


    function end() {

        if (
            startY ===
            null
        ) {
            return;
        }


        const distance =
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
            distance > 80
        ) {

            sheet.style.transform =
                "translateY(100%)";


            setTimeout(
                () => {

                    closeVehicleDetails(
                        backdrop,
                        sheet
                    );

                    reset();

                },
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


    grabber.addEventListener(
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


    grabber.addEventListener(
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


    grabber.addEventListener(
        "touchend",
        end
    );


    /*
     * Mouse support makes the same gesture
     * usable while testing on Windows.
     */

    let mouseDragging =
        false;


    grabber.addEventListener(
        "mousedown",
        event => {

            mouseDragging =
                true;


            begin(
                event.clientY
            );

        }
    );


    window.addEventListener(
        "mousemove",
        event => {

            if (
                !mouseDragging
            ) {
                return;
            }


            move(
                event.clientY
            );

        }
    );


    window.addEventListener(
        "mouseup",
        () => {

            if (
                !mouseDragging
            ) {
                return;
            }


            mouseDragging =
                false;


            end();

        }
    );

}