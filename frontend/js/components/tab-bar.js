export function initializeTabBar() {

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.page;


                    document
                        .querySelectorAll(
                            "[data-page]"
                        )
                        .forEach(tab => {

                            tab.classList.toggle(
                                "active",
                                tab === button
                            );

                        });


                    if (
                        page !== "vehicle"
                    ) {

                        console.log(
                            `${page} page not loaded yet`
                        );

                    }

                }
            );

        });

}