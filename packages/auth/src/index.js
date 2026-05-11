// Async import is required by Module Federation so that shared libraries
// (react, react-dom, etc.) can be negotiated between remotes before any
// module code runs.
import("./bootstrap");
