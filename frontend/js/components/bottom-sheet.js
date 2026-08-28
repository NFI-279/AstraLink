export function openBottomSheet(backdrop) {
    if (!backdrop) {
        return;
    }

    backdrop.classList.remove("hidden");
}


export function closeBottomSheet(backdrop) {
    if (!backdrop) {
        return;
    }

    backdrop.classList.add("hidden");
}


export function setupBottomSheet({
    backdrop,
    closeSelector
}) {
    if (!backdrop) {
        return;
    }


    backdrop
        .querySelectorAll(closeSelector)
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {
                    closeBottomSheet(
                        backdrop
                    );
                }
            );

        });


    backdrop.addEventListener(
        "click",
        event => {

            if (
                event.target
                === backdrop
            ) {
                closeBottomSheet(
                    backdrop
                );
            }

        }
    );


    setupDragToDismiss(
        backdrop
    );
}


function setupDragToDismiss(
    backdrop
) {

    const sheet =
        backdrop.querySelector(
            ".bottom-sheet"
        );

    if (!sheet) {
        return;
    }


    let startY = null;
    let lastY = null;


    sheet.addEventListener(
        "touchstart",
        event => {

            startY =
                event.touches[0]
                    .clientY;

            lastY =
                startY;

            sheet.style.transition =
                "none";

        },
        {
            passive: true
        }
    );


    sheet.addEventListener(
        "touchmove",
        event => {

            if (
                startY === null
            ) {
                return;
            }

            lastY =
                event.touches[0]
                    .clientY;

            const difference =
                Math.max(
                    0,
                    lastY - startY
                );

            sheet.style.transform =
                `translateY(${difference}px)`;

        },
        {
            passive: true
        }
    );


    sheet.addEventListener(
        "touchend",
        () => {

            if (
                startY === null
            ) {
                return;
            }


            const difference =
                Math.max(
                    0,
                    lastY - startY
                );


            sheet.style.transition =
                "transform 180ms ease";


            if (
                difference >= 72
            ) {

                closeBottomSheet(
                    backdrop
                );

            }


            sheet.style.transform =
                "translateY(0)";


            startY =
                null;

            lastY =
                null;

        }
    );
}