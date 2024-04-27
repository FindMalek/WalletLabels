import { connectDB } from "@/lib/mongodb";
import { parseQueryParamsAddress } from "@/lib/query-params";

export async function GET(request: Request) {
  const { address, limit } = parseQueryParamsAddress(request);

  if (address === "") {
    return new Response(
      JSON.stringify({
        message: "Bad request: 'address' parameter missing",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const db = await connectDB();

  const queryAtlas = {
    address: address,
  };

  const projection = {
    protocols: 1,
    last_txs: 1,
    label: 1,
    label_subtype: 1,
    address: 1,
    blockchain: 1,
  };

  try {
    const cursor = db
      .collection(process.env.CLC_NAME_WLBLS_MEV!)
      .find(queryAtlas, { projection })
      .collation({ locale: "en", strength: 1 })
      .limit(limit);

    const labels = await cursor.toArray();

    const response = {
      data: labels.map((label) => ({
        address: label.address,
        blockchain: label.blockchain,
        label: label.label,
        label_subtype: label.label_subtype,
        last_txs: label.last_txs,
        protocols: label.protocols,
      })),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
