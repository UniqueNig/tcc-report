import bcrypt from "bcryptjs";
import { connectDB } from "@/src/lib/db";
import { Unit } from "@/src/models/Unit";
import { User, type IUser } from "@/src/models/User";

export interface DemoAccount {
  role: "ADMIN" | "CORE_LEADER" | "UNIT_HEAD";
  name: string;
  email: string;
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "ADMIN",
    name: "Pastor Adewale",
    email: "admin@churchreport.local",
    password: "admin1234",
  },
  {
    role: "CORE_LEADER",
    name: "Br. Oluwole",
    email: "coreleader@churchreport.local",
    password: "core1234",
  },
  {
    role: "UNIT_HEAD",
    name: "Adeola Obi",
    email: "unithead@churchreport.local",
    password: "unit1234",
  },
];

const DEMO_UNIT_NAME = "Music Unit";

async function upsertUser(account: DemoAccount): Promise<IUser> {
  const passwordHash = await bcrypt.hash(account.password, 10);

  const user = await User.findOneAndUpdate(
    { email: account.email },
    {
      $set: {
        name: account.name,
        role: account.role,
        passwordHash,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  return user;
}

export async function ensureDemoAccounts() {
  await connectDB();

  const admin = await upsertUser(DEMO_ACCOUNTS[0]);
  const coreLeader = await upsertUser(DEMO_ACCOUNTS[1]);
  const unitHead = await upsertUser(DEMO_ACCOUNTS[2]);

  const unit = await Unit.findOneAndUpdate(
    { name: DEMO_UNIT_NAME },
    {
      $set: {
        name: DEMO_UNIT_NAME,
        coreLeaderId: coreLeader._id,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  await User.findByIdAndUpdate(unitHead._id, {
    $set: { unitId: unit._id },
  });

  await User.findByIdAndUpdate(admin._id, {
    $unset: { unitId: "" },
  });

  await User.findByIdAndUpdate(coreLeader._id, {
    $unset: { unitId: "" },
  });

  return {
    unitName: DEMO_UNIT_NAME,
    accounts: DEMO_ACCOUNTS,
  };
}
