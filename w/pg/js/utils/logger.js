export class Logger {
    static log(component, action, details = {}) {
        console.log(
            `[${new Date().toISOString()}] ${component} | ${action} |`,
            JSON.stringify(details, null, 2)
        );
    }

    static error(component, action, error) {
        console.error(
            `[${new Date().toISOString()}] ERROR: ${component} | ${action} |`,
            error
        );
    }
}
