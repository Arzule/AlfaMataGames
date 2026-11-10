#!/bin/sh
# Apaga (desasigna) esta VM con su identidad administrada: deja de cobrar el cómputo.
# Lo ejecuta el temporizador apagado-enero.timer. Necesita el rol "Virtual Machine Contributor"
# de la identidad sobre la propia VM.
set -eu
META=$(curl -s -H Metadata:true "http://169.254.169.254/metadata/instance/compute?api-version=2021-02-01")
SUB=$(echo "$META" | sed -n 's/.*"subscriptionId":"\([^"]*\)".*/\1/p')
RG=$(echo "$META" | sed -n 's/.*"resourceGroupName":"\([^"]*\)".*/\1/p')
VM=$(echo "$META" | sed -n 's/.*"name":"\([^"]*\)".*/\1/p' | head -n1)
TOKEN=$(curl -s -H Metadata:true "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
curl -s -o /dev/null -w "deallocate %{http_code}\n" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Length: 0" \
  "https://management.azure.com/subscriptions/$SUB/resourceGroups/$RG/providers/Microsoft.Compute/virtualMachines/$VM/deallocate?api-version=2024-07-01"
