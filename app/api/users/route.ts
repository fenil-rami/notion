// @ts-nocheck
import stripe from "@/lib/stripe";
import { NextResponse } from "next/server";

import nodemailer from 'nodemailer'


export async function POST(req: Request) {
  try {
    const public_domain = process.env.NEXT_PUBLIC_DOMAIN;

    const { email, userName } = await req.json();

    // console.log("Starting sending email ...");
    
        const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            auth: {
                user: '777144001@smtp-brevo.com',
                pass: 'SVp4MbPHhwOLG7fy',
            },
        });

        const subject = "New Invitation from" + userName;
        const body = `
          <h1>Hey ${email},</h1>
          <p>You got invitation from ${userName}, please vist site and do registrtion for access contents <a href="https://convex.com">convex.com</a></p>
          
          <p><a href="https://convex.com">Visit convex.io</a> to explore our plans and choose the one that best suits your needs.</p>
          <p>Best regards,<br>convex.com Team</p>
        `;

        const params = {
            from: '"CONVEX.IO" <no-reply@pdfgpt.io>',
            to: email,
            subject: subject,
            html: body,
        };

        transporter.sendMail(params)
            .then(() => {
                // console.log(`Email sent successfully to ${params.to}`);
                return { status: 'fulfilled', user: params.to };
            })
            .catch((error) => {
                console.error(`Failed to send email to ${params.to}:`, error);
                return { status: 'rejected', user: params.to, reason: error };
            });

    

    // const isExistingCustomer = await stripe.customers.list({ email });

    // let customer;

    // if (isExistingCustomer.data.length) {
    //   customer = isExistingCustomer.data[0];
    // }

    // if (!customer) {
    //   customer = await stripe.customers.create({
    //     email,
    //     metadata: { userId },
    //   });
    // }

    // const subscriptions = await stripe.subscriptions.list({
    //   customer: customer.id,
    // });

    // const isSubscribed = subscriptions.data.find(
    //   (sub) => sub.status === "active"
    // );

    // if (!isSubscribed) {
    //   const subscription = await stripe.checkout.sessions.create({
    //     mode: "subscription",
    //     payment_method_types: ["card"],
    //     line_items: [{ price: priceId, quantity: 1 }],
    //     customer: customer.id,
    //     success_url: `${public_domain}/documents`,
    //     cancel_url: `${public_domain}`,
    //   });

    //   return NextResponse.json(subscription.url);
    // } else {
    //   const portal = await stripe.billingPortal.sessions.create({
    //     customer: customer.id,
    //     return_url: `${public_domain}/documents`,
    //   });

      return NextResponse.json({ status: 'true'});
    
  } catch (error) {
    return NextResponse.json(
      `Something went wrong. Please try again - ${error}`,
      {
        status: 500,
      }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    const customer = await stripe.customers.list({ email: email! });

    if (!customer.data.length) return NextResponse.json("Free");

    const subscriptions: any = await stripe.subscriptions.list({
      customer: customer.data[0].id,
      expand: ["data.plan.product"],
    });

    if (!subscriptions.data.length) return NextResponse.json("Free");

    return NextResponse.json(subscriptions.data[0].plan.product.name);
  } catch (error) {
    return NextResponse.json(
      `Something went wrong. Please try again - ${error}`,
      {
        status: 500,
      }
    );
  }
}
