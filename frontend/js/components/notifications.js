let notificationsInitialized =
    false;


export function initializeNotifications() {

    if (
        notificationsInitialized
    ) {
        return;
    }


    notificationsInitialized =
        true;


    const backdrop =
        document.getElementById(
            "notificationsBackdrop"
        );


    const sheet =
        document.getElementById(
            "notificationsSheet"
        );


    const closeButton =
        document.getElementById(
            "closeNotifications"
        );


    const clearButton =
        document.getElementById(
            "markNotificationsRead"
        );


    const list =
        document.getElementById(
            "notificationsList"
        );


    const empty =
        document.getElementById(
            "notificationsEmpty"
        );


    if (
        !backdrop
        || !sheet
    ) {
        return;
    }


    document.addEventListener(
        "click",
        event => {

            const bell =
                event.target.closest(
                    "[data-open-notifications]"
                );


            if (
                bell
            ) {
                openNotifications(
                    backdrop
                );

                return;
            }


            if (
                event.target ===
                backdrop
            ) {
                closeNotifications(
                    backdrop
                );
            }

        }
    );


    closeButton
        ?.addEventListener(
            "click",
            () => {

                closeNotifications(
                    backdrop
                );

            }
        );


    clearButton
        ?.addEventListener(
            "click",
            () => {

                clearNotifications(
                    list,
                    empty,
                    clearButton
                );

            }
        );


    initializeNotificationDrag(
        sheet,
        backdrop
    );

}


function openNotifications(
    backdrop
) {

    backdrop.classList.remove(
        "hidden"
    );

}


function closeNotifications(
    backdrop
) {

    backdrop.classList.add(
        "hidden"
    );

}


function clearNotifications(
    list,
    empty,
    button
) {

    if (
        !list
        || !empty
    ) {
        return;
    }


    list
        .querySelectorAll(
            "[data-notification]"
        )
        .forEach(
            notification => {

                notification.remove();

            }
        );


    list.classList.add(
        "hidden"
    );


    empty.classList.remove(
        "hidden"
    );


    if (
        button
    ) {
        button.classList.add(
            "hidden"
        );
    }

}


function initializeNotificationDrag(
    sheet,
    backdrop
) {

    let startY =
        null;

    let currentY =
        null;


    function begin(
        y
    ) {

        startY =
            y;

        currentY =
            y;


        sheet.style.transition =
            "none";

    }


    function move(
        y
    ) {

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
                currentY
                - startY
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
            delta > 80
        ) {

            backdrop
                .classList
                .add(
                    "hidden"
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