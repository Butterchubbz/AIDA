/// <reference path="../pb_data/types.d.ts" />

/**
 * Checks if the initial admin setup has been completed.
 * This is called by the frontend on startup.
 */
routerAdd("GET", "/api/aida-setup-check", (c) => {
    try {
        const totalAdmins = $app.dao().totalAdmins();
        return c.json(200, { isSetup: totalAdmins > 0 });
    } catch (err) {
        console.error("Failed to check for admins:", err);
        return c.json(500, { error: "Failed to check for admins." });
    }
});

/**
 * Executes the initial admin setup from the UI form.
 */
routerAdd("POST", "/api/aida-setup-execute", (c) => {
    // First, ensure no admins exist to prevent misuse of this endpoint.
    const totalAdmins = $app.dao().totalAdmins();
    if (totalAdmins > 0) {
        return c.json(400, { error: "Setup has already been completed." });
    }

    const data = $apis.requestInfo(c).data;

    if (!data.email || !data.password || !data.passwordConfirm) {
        return c.json(400, { error: "Missing required fields." });
    }

    const admin = new Admin();
    const form = new RecordUpsertForm($app, admin);

    form.loadData({
        "email": data.email,
        "password": data.password,
        "passwordConfirm": data.passwordConfirm,
    });

    return form.submit(() => {
        return c.json(200, { message: "Admin account created successfully." });
    });
});

/**
 * Resets the application by deleting all admin accounts.
 * This is a destructive action that will require setup to be run again.
 */
routerAdd("POST", "/api/aida-reset-setup", (c) => {
    try {
        const admins = $app.dao().findAllAdmins();
        for (const admin of admins) {
            $app.dao().deleteAdmin(admin);
        }
        // NOTE: This is a simplified reset. A full reset might involve
        // deleting the 'pb_data' directory manually for a complete wipe.
        return c.json(200, { message: "Admin accounts have been deleted. Refresh to re-run setup." });
    } catch (err) {
        console.error("Failed to reset setup:", err);
        return c.json(500, { error: "Failed to reset setup." });
    }
});