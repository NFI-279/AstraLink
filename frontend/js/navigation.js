export function initializeNavigation() {

    document
        .querySelectorAll(
            "[data-screen]"
        )
        .forEach(
            tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        const screen =
                            tab.dataset
                                .screen;


                        showScreen(
                            screen
                        );

                    }
                );

            }
        );

}


export function showScreen(
    screenName
) {

    const target =
        document.getElementById(
            `screen-${screenName}`
        );


    if (!target) {
        return;
    }


    document
        .querySelectorAll(
            ".screen"
        )
        .forEach(
            screen => {

                screen
                    .classList
                    .remove(
                        "active"
                    );

            }
        );


    target
        .classList
        .add(
            "active"
        );


    document
        .querySelectorAll(
            "[data-screen]"
        )
        .forEach(
            tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.screen
                    === screenName
                );

            }
        );


    document.body
        .classList.toggle(
            "vehicle-active",
            screenName ===
                "vehicle"
        );


    if (
        screenName ===
        "settings"
    ) {

        target.scrollTop =
            0;

    }

}