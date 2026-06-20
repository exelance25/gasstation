import { NextResponse } from "next/server";

import { z } from "zod";

import { isRelayerConfigured } from "@/config/relayer-env";

import { getPumpRelayer } from "@/server/relayer/pump-relayer";

import { assertRelayAuthorized } from "@/server/security/relay-auth";

import { checkRateLimit, getClientIp } from "@/server/security/rate-limit-store";



const userOpSchema = z.object({

  sender: z.string(),

  nonce: z.string(),

  initCode: z.string(),

  callData: z.string(),

  callGasLimit: z.string(),

  verificationGasLimit: z.string(),

  preVerificationGas: z.string(),

  maxFeePerGas: z.string(),

  maxPriorityFeePerGas: z.string(),

  paymasterAndData: z.string(),

  signature: z.string().min(10),

});



const bodySchema = z.object({

  userOp: userOpSchema,

  intentId: z.string().optional(),

});



export async function POST(request: Request) {

  if (!isRelayerConfigured()) {

    return NextResponse.json(

      { error: "Relayer yapılandırılmamış" },

      { status: 503 },

    );

  }



  const ip = getClientIp(request);

  if (!checkRateLimit("relay-submit", ip, 30)) {

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

    const { userOp, intentId } = bodySchema.parse(json);



    const relayer = getPumpRelayer();

    const transactionHash = await relayer.sendUserOperation(userOp);



    return NextResponse.json({

      transactionHash,

      beneficiary: relayer.beneficiary,

      intentId: intentId ?? null,

    });

  } catch (error) {

    const message =

      error instanceof z.ZodError

        ? "Invalid UserOperation payload"

        : error instanceof Error

          ? error.message

          : "Submit failed";

    return NextResponse.json({ error: message }, { status: 400 });

  }

}


