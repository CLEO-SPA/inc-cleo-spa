export const handleApiError = (error) => {
    if (!navigator.onLine) {
        return "No internet connection. Please check your network.";
    }
    if (error.response?.status) {
        switch (error.response.status) {
            case 400:
                return error.response.data?.message || "Invalid data provided.";
            case 401:
                return "Session expired. Please login again.";
            case 403:
                return "You don't have permission for this action.";
            case 404:
                return "Endpoint not found";
            case 409:
                return "This entry already exists.";
            case 422:
                return "Please check your input and try again.";
            case 500:
                return "Server error. Please try again in a few minutes.";
            default:
                return `Server error (${error.response.status}). Please try again.`;
        }
    }
    return `Server error (500). Please try again.`;
}

export const handleSystemError = (error) => {
    switch (error.name) {
        case 'TypeError':
            return "A type error occurred. Possibly called something that wasn't a function or accessed a property of undefined.";
        case 'ReferenceError':
            return "A reference error occurred. A variable might not have been declared.";
        case 'SyntaxError':
            return "A syntax error occurred. There may be a typo in your code.";
        case 'RangeError':
            return "A range error occurred. A value was out of the expected range.";
        case 'URIError':
            return "A URI error occurred. Check your URL or URI-related function.";
        case 'EvalError':
            return "An eval error occurred. There was an issue using eval().";
        default:
            return `An unexpected error occurred: ${error.message}`;
    }
}

export const isRetryableError = (error) => {
    return error.response?.status >= 500 ||
        error.code === 'ECONNABORTED' ||
        !navigator.onLine;
};