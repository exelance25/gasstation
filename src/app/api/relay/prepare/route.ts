import { NextResponse } from "next/server";

import { z } from "zod";

import { isRelayerConfigured } from "@/config/relayer-env";

import { prepareUserOperation } from "@/server/relayer/prepare-user-op";

import { getPumpPaymasterAddress } from "@/lib/paymaster-config";

import { assertRelayAuthorized } from "@/server/security/relay-auth";

import { checkRateLimit, getClientIp } from "@/server/security/rate-limit-store";



const bodySchema = z.object({

  sender: z.string().regex(/^0x[0-9a-fA-F]{40}$/),

  callData: z.string().regex(/^0x[0-9a-fA-F]*$/).optional(),

  initCode: z.string().regex(/^0x[0-9a-fA-F]*$/).optional(),

  usePaymaster: z.boolean().optional(),

  feeToken: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),

});



export async function POST(request: Request) {

  if (!isRelayerConfigured()) {

    return NextResponse.json(

      { error: "Relayer yapılandırılmamış (RELAYER_PRIVATE_KEY + RPC)" },

      { status: 503 },

    );

  }



  const ip = getClientIp(request);

  if (!checkRateLimit("relay-prepare", ip, 30)) {

    return NextResponse.json({ error: "Çok fazla istek" }, { status: 429 });

  }



  try {

    assertRelayAuthorized(request);

  } catch (err) {

    const message = err instanceof Error ? err.message : "Yetkisiz";

    return NextResponse.json({ error: message }, { status: 401 });

  }



  try {

    const json = await request.json();

    const input = bodySchema.parse(json);

    const paymaster = getPumpPaymasterAddress();



    const { userOp, userOpHash } = await prepareUserOperation(

      input,

      paymaster,

    );



    return NextResponse.json({ userOp, userOpHash });

  } catch (error) {

    const message =

      error instanceof z.ZodError

        ? error.flatten().fieldErrors

        : error instanceof Error

          ? error.message

          : "Prepare failed";

    return NextResponse.json({ error: message }, { status: 400 });

  }

}


