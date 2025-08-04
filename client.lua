local p = promise.new()

RegisterNUICallback('finished', function(data, _)
    SetNuiFocus(false, false)
    p:resolve(data)
end)

function Start(params)
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'start', params = params })
end

exports('StartAwait', function(params)
    p = promise.new()
    Start(params)
    local result = Citizen.Await(p)
    return result
end)

-- test command
RegisterCommand('testpipes', function()
    local r = exports['Bharat_pipes']:StartAwait({ rows = 5, cols = 5, timeLimit = 20 })
    print("Pipes result:", r.success)
end)
