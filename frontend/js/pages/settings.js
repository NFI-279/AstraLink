let settingsInitialized =
    false;


export function initializeSettingsPage() {

    if (
        settingsInitialized
    ) {
        return;
    }


    settingsInitialized =
        true;


    initializeSettingsToggles();

    initializeThemeControl();

    initializeSettingsActions();

}


function initializeSettingsToggles() {

    document
        .querySelectorAll(
            "[data-setting-toggle]"
        )
        .forEach(
            toggle => {

                toggle.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        const active =
                            toggle
                                .classList
                                .toggle(
                                    "active"
                                );


                        toggle.setAttribute(
                            "aria-checked",
                            String(
                                active
                            )
                        );

                    }
                );

            }
        );

}


function initializeThemeControl() {

    document
        .querySelectorAll(
            "[data-theme-option]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                "[data-theme-option]"
                            )
                            .forEach(
                                item => {

                                    item
                                        .classList
                                        .remove(
                                            "active"
                                        );

                                }
                            );


                        button
                            .classList
                            .add(
                                "active"
                            );


                        const theme =
                            button.dataset
                                .themeOption;


                        console.log(
                            `Theme selected: ${theme}`
                        );

                    }
                );

            }
        );

}


function initializeSettingsActions() {

    document
        .querySelectorAll(
            "[data-settings-action]"
        )
        .forEach(
            row => {

                row.addEventListener(
                    "click",
                    () => {

                        const action =
                            row.dataset
                                .settingsAction;


                        if (
                            action ===
                            "vehicle-details"
                        ) {
                            return;
                        }


                        showSettingsPlaceholder(
                            action
                        );

                    }
                );

            }
        );

}


function showSettingsPlaceholder(
    action
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {
        return;
    }


    const messages = {

        "vehicle-details":
            "Vehicle details coming next",

        "passkey":
            "Passkey setup coming next",

        "remote-unlock-security":
            "Remote unlock security coming next",

        "petrol-price":
            "Fuel settings coming next",

        "units":
            "Currency and units coming next",

        "estimated-refill":
            "Estimated refill settings coming next",

        "vehicle-name":
            "Vehicle name settings coming next",

        "map-app":
            "Preferred map app settings coming next",

        "about":
            "AstraLink information coming next"

    };


    toast.textContent =
        messages[action]
        ?? "Settings option coming next";


    toast
        .classList
        .add(
            "show"
        );


    clearTimeout(
        window.settingsToastTimer
    );


    window.settingsToastTimer =
        setTimeout(
            () => {

                toast
                    .classList
                    .remove(
                        "show"
                    );

            },
            1700
        );

}