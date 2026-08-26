export function AsyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve()
            .then(() => fn(req, res, next))
            .catch(next);
    };
}
//# sourceMappingURL=async-handler.js.map