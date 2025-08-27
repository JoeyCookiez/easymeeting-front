let sharedState = {}

const getSharedState = () => sharedState

const setSharedState = (next) => {
    sharedState = next || {}
    return sharedState
}

const updateSharedState = (patch) => {
    sharedState = { ...sharedState, ...(patch || {}) }
    return sharedState
}

export {
    getSharedState,
    setSharedState,
    updateSharedState
}




